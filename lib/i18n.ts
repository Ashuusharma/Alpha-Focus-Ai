import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      "welcome": "Welcome",
      "good_morning": "Good Morning",
      "good_afternoon": "Good Afternoon",
      "good_evening": "Good Evening",
      "refine_style": "Refine Your Style.",
      "ai_active": "AI System Active",
      "new_analysis": "New AI Analysis",
      "view_dashboard": "View Dashboard",
      "habit_score": "Habit Score",
      "daily_consistency": "Daily consistency wrapper",
      "ai_insight": "AI Insight",
      "real_time_suggestions": "Real-time suggestions",
      "quick_actions": "Quick Actions",
      "face_analyzer": "Face Analyzer",
      "daily_routine": "Daily Routine",
      "community": "Community",
      "settings": "Settings",
      "questions_title": "Personalize Your Plan",
      "questions_subtitle": "Answer a few questions to get tailored advice.",
      "start_assessment": "Start Full Assessment",
      "continue": "Continue",
      "back": "Back",
      "submit": "Submit",
      "analyzing": "Analyzing...",
      "results": "Results",
      "language": "Language",
      "location": "Location",
      "humidity": "Humidity",
      "uv_index": "UV Index",
      "air_quality": "Air Quality",
      "hair_care": "Hair Care",
      "skin_care": "Skin Care",
      "beard_care": "Beard Care",
      "body_care": "Body Care",
      "health_care": "Health Care",
      "fitness": "Fitness",
      "fragrance": "Fragrance",
    }
  },
  hi: {
    translation: {
      "welcome": "स्वागत है",
      "good_morning": "सुप्रभात",
      "good_afternoon": "शुभ दोपहर",
      "good_evening": "शुभ संध्या",
      "refine_style": "अपनी शैली को निखारें।",
      "ai_active": "एआई सिस्टम सक्रिय",
      "new_analysis": "नया एआई विश्लेषण",
      "view_dashboard": "डैशबोर्ड देखें",
      "habit_score": "आदत स्कोर",
      "daily_consistency": "दैनिक निरंतरता",
      "ai_insight": "एआई सुझाव",
      "real_time_suggestions": "वास्तविक समय सुझाव",
      "quick_actions": "त्वरित कार्य",
      "face_analyzer": "चेहरा विश्लेषक",
      "daily_routine": "दैनिक दिनचर्या",
      "community": "समुदाय",
      "settings": "सेटिंग्स",
      "questions_title": "अपनी योजना निजीकृत करें",
      "questions_subtitle": "अनुकूलित सलाह पाने के लिए उत्तर दें।",
      "start_assessment": "पूरी मूल्यांकन शुरू करें",
      "continue": "जारी रखें",
      "back": "वापस",
      "submit": "जमा करें",
      "analyzing": "विश्लेषण...",
      "results": "परिणाम",
      "language": "भाषा",
      "location": "स्थान",
      "humidity": "नमी",
      "uv_index": "यूवी सूचकांक",
      "air_quality": "वायु गुणवत्ता",
      "hair_care": "बालों की देखभाल",
      "skin_care": "त्वचा की देखभाल",
      "beard_care": "दाढ़ी की देखभाल",
      "body_care": "शरीर की देखभाल",
      "health_care": "स्वास्थ्य देखभाल",
      "fitness": "फिटनेस",
      "fragrance": "सुगंध",
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "en", 
    interpolation: {
      escapeValue: false 
    }
  });

export default i18n;