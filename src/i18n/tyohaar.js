const translations = {
  // Hero / headings (called directly with t())
  'Today’s festival': { en: 'Today’s festival', hi: 'आज का त्योहार' },
  'Next festival': { en: 'Next festival', hi: 'अगला त्योहार' },
  'No upcoming festival': { en: 'No upcoming festival', hi: 'अभी कोई त्योहार नहीं' },
  Panchang: { en: 'Panchang', hi: 'पंचांग' },
  'मुहूर्त खोज': { en: 'Muhurta search', hi: 'मुहूर्त खोज' },
  'से': { en: 'to', hi: 'से' },

  // Legend
  'प्रमुख त्योहार': { en: 'Major festival', hi: 'प्रमुख त्योहार' },
  एकादशी: { en: 'Ekadashi', hi: 'एकादशी' },
  संक्रांति: { en: 'Sankranti', hi: 'संक्रांति' },
  प्रदोष: { en: 'Pradosha', hi: 'प्रदोष' },
  ग्रहण: { en: 'Eclipse', hi: 'ग्रहण' },
  'अन्य व्रत': { en: 'Other observance', hi: 'अन्य व्रत' },

  // Empty / error states
  'इस महीने कोई त्योहार नहीं।': { en: 'No festivals this month.', hi: 'इस महीने कोई त्योहार नहीं।' },
  'PDF नहीं बन सका — दोबारा कोशिश करें।':
    { en: 'PDF could not be created — please try again.', hi: 'PDF नहीं बन सका — दोबारा कोशिश करें।' },
  'वर्ष चुनें': { en: 'Choose year', hi: 'वर्ष चुनें' },
  'महीना चुनें': { en: 'Choose month', hi: 'महीना चुनें' },
  'शहर चुनें': { en: 'Choose city', hi: 'शहर चुनें' },

  // Festival list expand / collapse
  'View More': { en: 'View more', hi: 'और देखें' },
  'View Less': { en: 'View less', hi: 'कम देखें' },

  // Day sheet — section titles
  'सूर्य - चन्द्र': { en: 'Sun & Moon', hi: 'सूर्य - चन्द्र' },
  'पंचांग (पाँच अंग)': { en: 'Panchang (five angas)', hi: 'पंचांग (पाँच अंग)' },
  'शुभ मुहूर्त': { en: 'Auspicious muhurtas', hi: 'शुभ मुहूर्त' },
  'वर्ज्य / अशुभ काल': { en: 'Inauspicious periods', hi: 'वर्ज्य / अशुभ काल' },
  'मास - संवत - विशेष': { en: 'Month · Samvat · special', hi: 'मास - संवत - विशेष' },

  // Day sheet — sun/moon rows
  सूर्योदय: { en: 'Sunrise', hi: 'सूर्योदय' },
  सूर्यास्त: { en: 'Sunset', hi: 'सूर्यास्त' },
  'दिवमान (दिन)': { en: 'Day length', hi: 'दिवमान (दिन)' },
  'रात्रिमान (रात)': { en: 'Night length', hi: 'रात्रिमान (रात)' },
  चन्द्रोदय: { en: 'Moonrise', hi: 'चन्द्रोदय' },
  चन्द्रास्त: { en: 'Moonset', hi: 'चन्द्रास्त' },
  'चन्द्र राशि': { en: 'Moon sign', hi: 'चन्द्र राशि' },
  'सूर्य नक्षत्र': { en: 'Solar nakshatra', hi: 'सूर्य नक्षत्र' },
  तिथि: { en: 'Tithi', hi: 'तिथि' },
  नक्षत्र: { en: 'Nakshatra', hi: 'नक्षत्र' },
  योग: { en: 'Yoga', hi: 'योग' },
  करण: { en: 'Karana', hi: 'करण' },
  वार: { en: 'Weekday', hi: 'वार' },
  'समाप्ति:': { en: 'Ends:', hi: 'समाप्ति:' },
  'आज नहीं': { en: 'Not today', hi: 'आज नहीं' },

  // Muhurta labels
  'ब्रह्म मुहूर्त': { en: 'Brahma Muhurta', hi: 'ब्रह्म मुहूर्त' },
  'अभिजित मुहूर्त': { en: 'Abhijit Muhurta', hi: 'अभिजित मुहूर्त' },
  'विजय मुहूर्त': { en: 'Vijaya Muhurta', hi: 'विजय मुहूर्त' },
  'अमृत काल': { en: 'Amrit Kala', hi: 'अमृत काल' },
  मध्याह्न: { en: 'Madhyahna', hi: 'मध्याह्न' },
  निशीथ: { en: 'Nishita', hi: 'निशीथ' },
  गोधूलि: { en: 'Godhuli', hi: 'गोधूलि' },
  'प्रताः संध्या': { en: 'Morning Sandhya', hi: 'प्रताः संध्या' },
  'सायं संध्या': { en: 'Evening Sandhya', hi: 'सायं संध्या' },
  'राहु काल': { en: 'Rahu Kalam', hi: 'राहु काल' },
  'गुलिक काल': { en: 'Gulika Kalam', hi: 'गुलिक काल' },
  यमघण्ट: { en: 'Yamaganda', hi: 'यमघण्ट' },
  'विज्जो (वरज्य)': { en: 'Varjyam', hi: 'विज्जो (वरज्य)' },
  दुर्मुहूर्त: { en: 'Durmuhurta', hi: 'दुर्मुहूर्त' },
  भद्र: { en: 'Bhadra', hi: 'भद्र' },
  पंचक: { en: 'Panchaka', hi: 'पंचक' },
  पंचकनाश: { en: 'Panchakanasha', hi: 'पंचकनाश' },
  'दाह-कर्म वर्ज्य': { en: 'Avoid cremation rituals', hi: 'दाह-कर्म वर्ज्य' },
  गण्डमूल: { en: 'Gandamula', hi: 'गण्डमूल' },
  तीव्र: { en: 'Severe', hi: 'तीव्र' },
  हल्का: { en: 'Mild', hi: 'हल्का' },
  'चन्द्रमास': { en: 'Lunar month', hi: 'चन्द्रमास' },
  'सौर मास': { en: 'Solar month', hi: 'सौर मास' },
  'विक्रम संवत': { en: 'Vikram Samvat', hi: 'विक्रम संवत' },
  'शक संवत': { en: 'Shaka Samvat', hi: 'शक संवत' },
  'विशेष योग': { en: 'Special yogas', hi: 'विशेष योग' },
  'अधिक ': { en: 'Adhika ', hi: 'अधिक ' },
  'आनन्दादि:': { en: 'Anandadi:', hi: 'आनन्दादि:' },

  // Muhurt search
  'मुहूर्त चुनें — पूरे महीने में उसके दिन व समय लिस्ट हो जाएँगे। किसी दिन पर टैप करें तो उस दिन का पूरा पंचांग खुल जाएगा।':
    {
      en: 'Pick a muhurta — its dates and times for the whole month will be listed. Tap any day to open its full panchang.',
      hi: 'मुहूर्त चुनें — पूरे महीने में उसके दिन व समय लिस्ट हो जाएँगे। किसी दिन पर टैप करें तो उस दिन का पूरा पंचांग खुल जाएगा।',
    },
  'इस महीने यह मुहूर्त नहीं मिला।': { en: 'No such muhurta this month.', hi: 'इस महीने यह मुहूर्त नहीं मिला।' },
  अभिजित: { en: 'Abhijit', hi: 'अभिजित' },
  विजय: { en: 'Vijaya', hi: 'विजय' },
  ब्रह्म: { en: 'Brahma', hi: 'ब्रह्म' },
  राहु: { en: 'Rahu', hi: 'राहु' },
  गुलिक: { en: 'Gulika', hi: 'गुलिक' },
  'अशुभ मुहूर्त': { en: 'Inauspicious', hi: 'अशुभ मुहूर्त' },
};

export default translations;
