# MindSight AI

An end-to-end deep learning inference system for student depression risk screening, built to serve predictions reliably, explain them transparently, and degrade gracefully when things go wrong.

The architecture separates model training, artifact persistence, inference serving, and explainability into discrete layers. Each layer has a single responsibility and is independently replaceable.

---

## Stack

### Backend

**FastAPI** over Flask or Django — ASGI-native with built-in Pydantic validation on request boundaries. Flask is simpler for pure synchronous scripts; Django carries too much ORM overhead for a stateless inference service. FastAPI gives async handling, automatic OpenAPI docs, and type-driven validation without ceremony.

**TensorFlow / Keras** over PyTorch or tree-based alternatives — Keras simplifies model serialization and the `.keras` archive format keeps training artifacts self-contained. For a purely tabular problem, XGBoost or LightGBM would be faster to train and TreeSHAP would be cheaper to run; the neural network was a deliberate choice to demonstrate deep model serving, explainability under a non-tree architecture, and custom loss restoration at load time. PyTorch would be preferable for research flexibility, but its serialization story (state dicts, architecture coupling) adds friction in deployment handoffs.

**SHAP DeepExplainer** as primary, **KernelExplainer** as fallback — DeepExplainer is significantly faster for deep networks and is the default path. KernelExplainer is model-agnostic and available as a fallback when DeepExplainer initialization or runtime inference fails. This matters in deployment: serving environments can diverge from the training machine, and a system that silently fails to explain is worse than one that degrades to a slower-but-correct explanation path. Both paths cache results and the fallback path is also cached, so degraded behavior doesn't compound on repeated requests.

**scikit-learn** for preprocessing — `StandardScaler` and `OneHotEncoder` with `joblib` persistence keeps preprocessing deterministic across training and inference. Learned embeddings for categorical features could improve performance on high-cardinality inputs, but add leakage risk and complicate artifact management. Target encoding introduces similar risks. The scaler and encoder are loaded once at startup, not on every request.

**Uvicorn** as the ASGI server — runs as a single process locally; horizontally scalable behind a process manager or container orchestrator without application-layer changes.

### Frontend

**React + Vite** — fast dev builds, component-level isolation, and straightforward state management for the prediction form, batch upload flow, and analytics dashboard. Vite's build output is static assets that deploy without a Node runtime.

**Tailwind CSS** — utility-first styling with no runtime CSS-in-JS overhead. Theme toggle state is persisted across sessions.

**Recharts** for dashboard visualizations, **Framer Motion** for micro-interactions, **Axios** for HTTP.

---

## Architecture

```
Client Browser
      │
      ▼
React + Vite (static assets)
      │
      ▼
Reverse Proxy / Ingress
      │
      ▼
FastAPI  ──  Uvicorn
      │
      ├── depression_model.keras
      ├── scaler.pkl
      ├── encoder.pkl
      └── student_lifestyle_100k.csv
```

The backend is stateless across requests. All model and preprocessor state is loaded at startup and held in memory. The explainability layer maintains a process-local SHAP cache keyed on rounded processed feature vectors — repeated requests for the same input do not re-run SHAP. For multi-instance deployments this cache would move to Redis; for a single-instance deployment it eliminates redundant computation within a session.

---

## Model

Four-layer dense network with batch normalization and dropout at each hidden layer:

```
Dense(128) → BatchNorm → Dropout
Dense(64)  → BatchNorm → Dropout
Dense(32)  → BatchNorm → Dropout
Dense(1, sigmoid)
```

Training uses focal loss for class imbalance, tracks PR-AUC, precision, and recall, and applies early stopping on validation PR-AUC. A threshold sweep over the held-out test set picks the decision boundary that maximizes F1, rather than defaulting to 0.5.

---

## Reproducible Model Loading

Keras `.keras` archives can fail to deserialize across environments when legacy config keys are present. `services/model_loader.py` handles this without requiring the caller to know about it:

1. Attempt `load_model(..., compile=False)` with custom focal loss objects injected.
2. On deserialization failure, detect legacy archive keys, sanitize the config, reconstruct the model from sanitized config, and reload weights.

The caller receives a loaded model or a clear failure — never a partially-initialized object that passes type checks and breaks at inference time.

---

## Explainability

Single-request SHAP is implemented in `services/deep_explainability.py`.

One-hot encoded categorical SHAP values are aggregated back to their source features (`Gender`, `Department`) before the response is serialized, so the frontend receives feature-level attributions that match the input form — not internal preprocessed column names.

The default frontend screening input is prewarmed during backend startup. Lazy caching only helps after the first request; prewarming eliminates cold-start latency on the most common first interaction.

---

## Validation

Pydantic models enforce schema at API boundaries for both single-prediction and batch paths. The same validation rules apply to both:

- `Age ≤ 100`
- `CGPA` in `[0.0, 4.0]`
- `Stress_Level` in `[0, 10]`
- `Sleep_Duration + Study_Hours + Physical_Activity / 60 ≤ 24`

Batch inference isolates failures at row level. Invalid rows are counted and returned with error messages; they do not abort the batch or contaminate the healthy/high-risk summary counts.

Batch inference can be tested using `test.csv`
---

## Observability

Every request is timed. Processing duration is logged to stdout and exposed in two response headers:

- `X-Process-Time-Ms`
- `Server-Timing`

These headers are readable in browser devtools, Postman, curl, or any APM integration without additional instrumentation on the client side.

```bash
curl -i http://localhost:8000/stats
# inspect X-Process-Time-Ms and Server-Timing in response headers
```

The current logging surface — startup state, model initialization, SHAP initialization, fallback events, per-request timing — covers smoke testing, regression checks, and early deployment diagnostics. Structured JSON logging, Prometheus metrics, and request correlation IDs are the next production steps.

---

## API

### `POST /predict`

Returns probability, risk label, boolean prediction, SHAP base value, SHAP feature attributions, and rule-based recommendations.

### `POST /predict/batch`

Accepts a CSV upload. Returns per-row results, valid/flagged/healthy/invalid summary counts, and a downloadable result CSV with inline error messages for invalid rows.

### `GET /stats`

Returns dataset-level aggregates for the analytics dashboard: record count, depression rate, average stress and sleep, gender and department distributions, correlation matrix, and scatterplot sample.

---

## Local Development

```bash
# backend
cd backend
pip install -r requirements.txt
uvicorn app:app --reload

# frontend
cd frontend
npm install
npm run dev
```

On startup the backend loads the Keras model, restores custom loss definitions, initializes the SHAP explainer, and precomputes the default explanation cache entry.

---

## Deployment Readiness

The repository does not yet include committed Docker assets, but the architecture is container-ready:

- frontend builds to static assets with no runtime dependency on Node
- backend is a stateless ASGI process with artifact paths driven by config
- recommended container split: frontend static serving, backend FastAPI/Uvicorn, optional Nginx reverse proxy

Recommended deployment checks before containerizing:

- health and readiness endpoints gated on model + explainer initialization
- startup validation confirming `depression_model.keras`, `scaler.pkl`, and `encoder.pkl` are present
- environment-driven configuration for artifact paths and CORS origins
- pinned dependency versions with a `pip freeze` snapshot for reproducibility