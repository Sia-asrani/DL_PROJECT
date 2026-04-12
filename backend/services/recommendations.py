def generate_recommendations(data: dict, risk_prob: float):
    """
    Generates dynamic lifestyle recommendations based on the user's input data if risk probability > 0.4.
    """
    recs = []
    
    if risk_prob < 0.3:
        return ["Your lifestyle indicators look healthy. Maintain your current balance!"]
        
    if data.get("Sleep_Duration", 8) < 6.0:
        recs.append("Increase sleep duration. Aim for 7-9 hours per night to significantly reduce stress levels.")
    elif data.get("Sleep_Duration", 8) > 10.0:
        recs.append("Oversleeping detected. Try to standardize your sleep schedule to 8 hours for better energy regularity.")
        
    if data.get("Physical_Activity", 60) < 30:
        recs.append("Increase physical activity. Even 15-30 minutes of walking daily can release endorphins and improve mood.")
        
    if data.get("Study_Hours", 4) > 8:
        recs.append("Prolonged study hours. Introduce the Pomodoro technique (25 min study, 5 min break) to prevent academic burnout.")
        
    if data.get("Social_Media_Hours", 2) > 5:
        recs.append("High screen time. Consider reducing social media usage right before bedtime to improve cognitive rest.")
        
    if data.get("Stress_Level", 5) >= 7:
        recs.append("High stress reported. It is strongly recommended to explore mindfulness, meditation, or speak with a campus counselor.")
        
    if not recs:
        recs.append("Consider a standard check-in with your university wellness center. Maintaining a balanced lifestyle is highly beneficial.")
        
    return recs
