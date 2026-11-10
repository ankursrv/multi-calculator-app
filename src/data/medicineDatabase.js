/**
 * Comprehensive verified medical database of 80+ most commonly used
 * Indian & global medicines across all therapeutic categories.
 * Contains verified brand names, salts, indications, side effects, dosage advice,
 * and safety matrices in both Hindi and English.
 */

export const MEDICINE_DATABASE = [
  // ==================== 1. FEVER & PAIN (बुखार, सिरदर्द व दर्द निवारक) ====================
  {
    id: 'dolo-650',
    name: 'Dolo 650 / Paracetamol',
    brandNames: ['Dolo 650', 'Crocin 650', 'Calpol 650', 'Pacimol', 'P-650', 'Paracip 650', 'Sumo L', 'Crocin', 'Calpol', 'Paracetamol'],
    hindiNames: ['डोलो', 'डोलो 650', 'क्रोसीन', 'कालपोल', 'पैरासिटामोल', 'बुखार', 'सिरदर्द'],
    salt: 'Paracetamol (Acetaminophen) 650mg / 500mg',
    category_en: 'Antipyretic & Analgesic (Fever & Pain Relief)',
    category_hi: 'एंटीपीयरेटिक व दर्द निवारक (बुखार और बदन दर्द)',
    tag: 'Fever & Pain',
    uses_en: [
      'Reduces high fever (viral, flu, dengue, malaria, or general fever)',
      'Relieves mild to moderate pain (headache, toothache, muscle ache, back pain)',
      'Eases post-vaccination fever and body soreness',
    ],
    uses_hi: [
      'तेज़ बुखार (वायरल, फ्लू, डेंगू या सामान्य बुखार) को कम करता है',
      'सिरदर्द, बदन दर्द, दांत दर्द, कमर दर्द और जोड़ों के दर्द में आराम देता है',
      'टीकाकरण (वैक्सीनेशन) के बाद होने वाले बुखार और दर्द में असरदार',
    ],
    sideEffects_en: {
      common: ['Mild nausea or upset stomach if taken empty stomach', 'Sweating while fever breaks'],
      serious: ['Liver damage if taken in excessive dosage (>4000mg/day)', 'Allergic skin rash or facial swelling (rare)'],
    },
    sideEffects_hi: {
      common: ['खाली पेट लेने पर हल्की मतली या पेट में बेचैनी', 'बुखार उतरते समय पसीना आना'],
      serious: ['अधिक मात्रा (ओवरडोज़ >4000mg प्रतिदिन) लेने पर लिवर को गंभीर नुकसान', 'त्वचा पर लाल चकत्ते या सूजन (दुर्लभ)'],
    },
    howToUse_en: 'Take with a glass of water, preferably after a meal. Keep a gap of 4 to 6 hours between doses. Do not exceed 4 tablets in 24 hours without doctor recommendation.',
    howToUse_hi: 'एक गिलास पानी के साथ खाना खाने के बाद लें। दो खुराकों के बीच कम से कम 4 से 6 घंटे का अंतर रखें। 24 घंटे में डॉक्टर की सलाह के बिना 4 गोली से अधिक न लें।',
    precautions_en: [
      'Strictly avoid alcohol: combining alcohol with paracetamol multiplies liver toxicity risk.',
      'Check other cold/cough medicines so you do not accidentally double-dose paracetamol.',
      'If fever does not subside within 3 days, consult a physician for blood tests.',
    ],
    precautions_hi: [
      'शराब का सेवन बिल्कुल न करें: पैरासिटामोल के साथ शराब लिवर को भारी नुकसान पहुंचाती है।',
      'सर्दी-खांसी की अन्य दवाओं के घटक चेक करें ताकि पैरासिटामोल की दोहरी खुराक न हो जाए।',
      'यदि बुखार 3 दिन के बाद भी न उतरे, तो तुरंत डॉक्टर से संपर्क करें और जांच कराएं।',
    ],
    safetyAdvice: {
      pregnancy: { text_en: 'Generally considered safest for fever under doctor guidance', text_hi: 'डॉक्टर की सलाह पर गर्भावस्था में सबसे सुरक्षित माना जाता है', status: 'safe' },
      alcohol: { text_en: 'Unsafe: Increases acute liver damage risk', text_hi: 'असुरक्षित: लिवर डैमेज का गंभीर खतरा', status: 'unsafe' },
      driving: { text_en: 'Safe: Does not cause sedation', text_hi: 'सुरक्षित: सुस्ती या नींद नहीं आती', status: 'safe' },
      kidneyLiver: { text_en: 'Caution: Reduce dose in liver or chronic kidney disease', text_hi: 'सावधानी: लिवर या किडनी के मरीज कम डोज लें', status: 'caution' },
    },
    keywords: ['dolo', 'dolo650', 'paracetamol', 'calpol', 'crocin', 'fever', 'bukhar', 'headache', 'dard', 'pain', 'pacimol', 'paracip', 'sir dard'],
  },

  {
    id: 'combiflam',
    name: 'Combiflam',
    brandNames: ['Combiflam', 'Ibugesic Plus', 'Flexon', 'Brufen Plus'],
    hindiNames: ['कॉम्बिफ्लाम', 'फ्लेक्सॉन', 'आईबुजेसिक', 'दांत दर्द', 'जोड़ों का दर्द'],
    salt: 'Ibuprofen (400mg) + Paracetamol (325mg)',
    category_en: 'NSAID & Analgesic (Pain & Inflammation Relief)',
    category_hi: 'दर्द व सूजन रोधी दवा (दर्द और सूजन में राहत)',
    tag: 'Fever & Pain',
    uses_en: [
      'Relief from severe headaches, migraine, toothache, and dental pain',
      'Reduces muscle swelling, sprains, joint pain, and menstrual cramps',
      'Lowers fever accompanied by inflammatory body aches',
    ],
    uses_hi: [
      'तेज सिरदर्द, माइग्रेन, दांत दर्द और दाढ़ के दर्द में तुरंत राहत',
      'मांसपेशियों की सूजन, मोच, जोड़ों के दर्द और पीरियड्स (मासिक धर्म) के दर्द में असरदार',
      'शरीर के टूटन और सूजन के साथ आने वाले बुखार को कम करता है',
    ],
    sideEffects_en: {
      common: ['Acidity, heartburn, stomach burning, mild nausea'],
      serious: ['Stomach ulcers or gastric bleeding with prolonged use', 'Elevated blood pressure'],
    },
    sideEffects_hi: {
      common: ['एसिडिटी, सीने में जलन, पेट में मरोड़ या हल्की उल्टी'],
      serious: ['लंबे समय तक बिना डॉक्टर के लेने पर पेट में छाले (अल्सर) या ब्लीडिंग', 'ब्लड प्रेशर बढ़ना'],
    },
    howToUse_en: 'ALWAYS take after a full meal or with milk. NEVER take on an empty stomach to prevent gastric irritation.',
    howToUse_hi: 'हमेशा भरपेट भोजन या दूध के बाद ही लें। खाली पेट इसे कभी न लें ताकि पेट में जलन या छाले न हों।',
    precautions_en: [
      'Do not take if you have a history of stomach ulcers or asthma.',
      'Avoid taking additional painkillers (like Brufen or Diclofenac) simultaneously.',
      'Drink plenty of water to protect your kidneys.',
    ],
    precautions_hi: [
      'यदि आपको पेट में अल्सर या दमा (अस्थमा) है तो इसका सेवन न करें।',
      'इसके साथ अन्य दर्द निवारक (जैसे ब्रूफेन या डाइक्लोफेनाक) एक साथ न लें।',
      'किडनी की सुरक्षा के लिए दिनभर में पर्याप्त पानी पिएं।',
    ],
    safetyAdvice: {
      pregnancy: { text_en: 'Unsafe in 3rd trimester: Consult doctor', text_hi: 'तीसरी तिमाही में असुरक्षित: डॉक्टर से पूछें', status: 'unsafe' },
      alcohol: { text_en: 'Unsafe: Increases stomach bleeding risk', text_hi: 'असुरक्षित: पेट में ब्लीडिंग का जोखिम बढ़ाता है', status: 'unsafe' },
      driving: { text_en: 'Safe for most; stop if dizzy', text_hi: 'सामान्यतः सुरक्षित; चक्कर आए तो ड्राइव न करें', status: 'safe' },
      kidneyLiver: { text_en: 'Caution: NSAIDs strain kidneys', text_hi: 'सावधानी: किडनी और बीपी के मरीज परहेज करें', status: 'caution' },
    },
    keywords: ['combiflam', 'ibuprofen', 'flexon', 'ibugesic', 'pain', 'dard', 'toothache', 'swelling', 'sujan', 'brufen'],
  },

  {
    id: 'saridon',
    name: 'Saridon',
    brandNames: ['Saridon', 'Dart'],
    hindiNames: ['सैरिडॉन', 'सेरिडोन', 'डाsubרט', 'सिर दर्द की गोली'],
    salt: 'Paracetamol (250mg) + Propyphenazone (150mg) + Caffeine (50mg)',
    category_en: 'Analgesic (Fast Headache Relief)',
    category_hi: 'तीव्र सिरदर्द निवारक दवा',
    tag: 'Fever & Pain',
    uses_en: [
      'Fast-acting relief from severe tension headache and migraine',
      'Relief from toothache, sinus headache, and feverish aches',
    ],
    uses_hi: [
      'भयंकर सिरदर्द, तनाव वाले सिरदर्द और माइग्रेन में 15 से 30 मिनट में तेज आराम',
      'दांत दर्द, साइनस सिरदर्द और बदन की अकड़न में राहत',
    ],
    sideEffects_en: {
      common: ['Restlessness or insomnia (due to caffeine), mild acidity'],
      serious: ['Palpitations if taken in excess'],
    },
    sideEffects_hi: {
      common: ['बेचैनी, अनिद्रा (कैफीन की वजह से), पेट में हल्की जलन'],
      serious: ['अत्यधिक सेवन से दिल की धड़कन तेज होना'],
    },
    howToUse_en: 'Take 1 tablet with water when headache begins. Do not take close to bedtime.',
    howToUse_hi: 'सिरदर्द शुरू होने पर 1 गोली पानी के साथ लें। रात को सोते समय लेने से बचें ताकि नींद में रुकावट न हो।',
    precautions_en: ['Limit intake to 1-2 tablets per day. Avoid excess tea/coffee alongside.'],
    precautions_hi: ['दिन में 1-2 गोली से अधिक न लें। इसके साथ चाय-कॉफी ज्यादा न पिएं।'],
    safetyAdvice: {
      pregnancy: { text_en: 'Avoid without doctor advice', text_hi: 'डॉक्टर से पूछकर लें', status: 'caution' },
      alcohol: { text_en: 'Unsafe', text_hi: 'असुरक्षित', status: 'unsafe' },
      driving: { text_en: 'Safe', text_hi: 'सुरक्षित', status: 'safe' },
      kidneyLiver: { text_en: 'Caution with liver issues', text_hi: 'लिवर रोगी सावधानी रखें', status: 'caution' },
    },
    keywords: ['saridon', 'dart', 'sir dard', 'headache', 'migraine', 'caffeine', 'fast pain relief'],
  },

  {
    id: 'disprin',
    name: 'Disprin / Aspirin',
    brandNames: ['Disprin', 'Aspirin', 'Ecosprin 75', 'Delisprin'],
    hindiNames: ['डिस्प्रिन', 'एस्पिरिन', 'इकोस्प्रिन', 'खून पतला'],
    salt: 'Acetylsalicylic Acid (Aspirin) 350mg / 75mg',
    category_en: 'NSAID & Antiplatelet (Pain Relief & Blood Thinner)',
    category_hi: 'दर्द निवारक व रक्त पतला करने वाली दवा',
    tag: 'Fever & Pain',
    uses_en: [
      'Fast dissolvable relief from headache, toothache, and body pain',
      'Low-dose (75mg) used as a life-saving blood thinner to prevent heart attack and stroke',
    ],
    uses_hi: [
      'पानी में घुलने वाली गोली, सिरदर्द, दांत दर्द और बुखार में तुरंत असर करती है',
      'कम खुराक (75mg) खून को पतला रखने और हार्ट अटैक व स्ट्रोक से बचाव में प्रयुक्त होती है',
    ],
    sideEffects_en: {
      common: ['Stomach burning, acidity, increased bleeding tendency from minor cuts'],
      serious: ['Gastric ulcer bleeding, bronchospasm in asthmatics'],
    },
    sideEffects_hi: {
      common: ['पेट में तेज जलन, एसिडिटी, कटने पर खून देर से जमना'],
      serious: ['पेट में अल्सर से खून बहना, दमा (अस्थमा) का दौरा'],
    },
    howToUse_en: 'Dissolve Disprin in half a glass of water before drinking. Always take after meals.',
    howToUse_hi: 'डिस्प्रिन को आधे गिलास पानी में घोलकर पिएं। हमेशा कुछ खाने के बाद ही लें।',
    precautions_en: [
      'NEVER give to children under 16 with viral fever (danger of fatal Reye syndrome).',
      'Avoid if you have asthma or bleeding disorders.',
    ],
    precautions_hi: [
      '16 वर्ष से कम उम्र के बच्चों को वायरल बुखार में कभी न दें (रेये सिंड्रोम का गंभीर खतरा)।',
      'अस्थमा या अल्सर के मरीज इसे न लें।',
    ],
    safetyAdvice: {
      pregnancy: { text_en: 'Unsafe in 3rd trimester', text_hi: 'तीसरी तिमाही में असुरक्षित', status: 'unsafe' },
      alcohol: { text_en: 'Unsafe: High risk of stomach bleeding', text_hi: 'असुरक्षित: पेट में ब्लीडिंग का खतरा', status: 'unsafe' },
      driving: { text_en: 'Safe', text_hi: 'सुरक्षित', status: 'safe' },
      kidneyLiver: { text_en: 'Caution', text_hi: 'सावधानी रखें', status: 'caution' },
    },
    keywords: ['disprin', 'aspirin', 'ecosprin', 'blood thinner', 'sir dard', 'heart attack emergency', 'headache'],
  },

  {
    id: 'voveran',
    name: 'Voveran / Diclofenac',
    brandNames: ['Voveran 50', 'Voveran SR 100', 'Dynapar', 'Diclogel'],
    hindiNames: ['वोवरान', 'डाइक्लोफेनाक', 'डायनापार', 'जोड़ों का दर्द', 'गठिया'],
    salt: 'Diclofenac Sodium (50mg / 100mg)',
    category_en: 'Potent NSAID (Severe Joint & Musculoskeletal Pain)',
    category_hi: 'गंभीर दर्द व गठिया रोधी दवा (दर्द निवारक)',
    tag: 'Fever & Pain',
    uses_en: [
      'Severe arthritis, knee joint pain, spondylitis, and gout attacks',
      'Post-surgery pain, bone fractures, dental extraction pain, and severe muscle sprains',
    ],
    uses_hi: [
      'गठिया (आर्थराइटिस), घुटनों का असहनीय दर्द, कमर दर्द, स्पॉन्डिलाइटिस और यूरिक एसिड दर्द',
      'हड्डी टूटने, ऑपरेशन के बाद के दर्द और दांत उखड़वाने के तेज दर्द में प्रभावी',
    ],
    sideEffects_en: {
      common: ['Gastric irritation, nausea, dizziness, fluid retention'],
      serious: ['Stomach ulceration, elevated liver enzymes with long-term use'],
    },
    sideEffects_hi: {
      common: ['पेट में जलन, उल्टी जैसा लगना, चक्कर, शरीर में हल्का सूजन'],
      serious: ['पेट में अल्सर, लंबे समय तक लेने पर लिवर या किडनी पर असर'],
    },
    howToUse_en: 'Take after a heavy meal. Drink full glass of water. Take antacid (like Pan 40) if prone to acidity.',
    howToUse_hi: 'भरपेट भोजन के बाद लें। एक गिलास पानी पिएं। एसिडिटी से बचने के लिए डॉक्टर साथ में गैस की दवा (जैसे पैन 40) देते हैं।',
    precautions_en: ['Avoid long unmonitored use. Heart and kidney patients should use under supervision.'],
    precautions_hi: ['बिना डॉक्टर के लंबे समय तक न लें। दिल और किडनी के मरीज विशेष सावधानी रखें।'],
    safetyAdvice: {
      pregnancy: { text_en: 'Avoid in pregnancy', text_hi: 'गर्भावस्था में न लें', status: 'unsafe' },
      alcohol: { text_en: 'Unsafe', text_hi: 'असुरक्षित', status: 'unsafe' },
      driving: { text_en: 'Safe unless experiencing dizziness', text_hi: 'चक्कर आए तो ड्राइविंग न करें', status: 'safe' },
      kidneyLiver: { text_en: 'Caution', text_hi: 'सावधानी रखें', status: 'caution' },
    },
    keywords: ['voveran', 'diclofenac', 'dynapar', 'arthritis', 'gathiya', 'joint pain', 'knee pain', 'ghutne ka dard'],
  },

  {
    id: 'zerodol-p',
    name: 'Zerodol-P / Aceclofenac + Paracetamol',
    brandNames: ['Zerodol-P', 'Zerodol-SP', 'Hifenac-P', 'Aceclo Plus'],
    hindiNames: ['जीरोडोल पी', 'जीरोडोल एसपी', 'हाइफेनाक', 'दर्द की गोली'],
    salt: 'Aceclofenac (100mg) + Paracetamol (325mg)',
    category_en: 'NSAID Analgesic (Musculoskeletal Pain & Swelling)',
    category_hi: 'मांसपेशियों व हड्डियों के दर्द की दवा',
    tag: 'Fever & Pain',
    uses_en: [
      'Relief from acute back pain, frozen shoulder, neck strain, and muscular pain',
      'Osteoarthritis and rheumatoid arthritis pain',
      'Tooth extraction pain and post-trauma swelling (Zerodol-SP contains Serratiopeptidase)',
    ],
    uses_hi: [
      'कमर दर्द, गर्दन में अकड़न, फ्रोजन शोल्डर और मांसपेशियों के तेज खिंचाव में राहत',
      'जोड़ों के दर्द, गठिया और मोच की सूजन को कम करता है',
      'दांत के दर्द और चोट के बाद सूजन व दर्द को तेजी से घटाता है',
    ],
    sideEffects_en: {
      common: ['Acidity, stomach discomfort, nausea, loose stools'],
      serious: ['Gastric erosions with prolonged continuous use'],
    },
    sideEffects_hi: {
      common: ['एसिडिटी, पेट में बेचैनी, मतली'],
      serious: ['लगातार कई दिनों तक लेने पर पेट में घाव'],
    },
    howToUse_en: 'Take 1 tablet twice daily after meals with water.',
    howToUse_hi: 'दिन में दो बार भोजन के बाद एक-एक गोली पानी से लें।',
    precautions_en: ['Always take with food; never on empty stomach. Avoid with other painkillers.'],
    precautions_hi: ['हमेशा खाना खाने के बाद ही लें, खाली पेट कभी नहीं।'],
    safetyAdvice: {
      pregnancy: { text_en: 'Avoid without prescription', text_hi: 'डॉक्टर से पूछें', status: 'unsafe' },
      alcohol: { text_en: 'Unsafe', text_hi: 'असुरक्षित', status: 'unsafe' },
      driving: { text_en: 'Safe', text_hi: 'सुरक्षित', status: 'safe' },
      kidneyLiver: { text_en: 'Caution', text_hi: 'सावधानी रखें', status: 'caution' },
    },
    keywords: ['zerodol', 'zerodol p', 'zerodol sp', 'aceclofenac', 'hifenac', 'kamar dard', 'back pain', 'neck pain'],
  },

  {
    id: 'meftal-spas',
    name: 'Meftal-Spas',
    brandNames: ['Meftal-Spas', 'Spasmonil', 'Colimex', 'Cyclopam'],
    hindiNames: ['मेफ्टाल स्पास', 'स्पैस्मोनिल', 'पेट दर्द', 'पीरियड्स दर्द'],
    salt: 'Mefenamic Acid (250mg) + Dicyclomine HCl (10mg)',
    category_en: 'Antispasmodic & Analgesic (Abdominal & Period Cramps)',
    category_hi: 'एंटीस्पास्मोडिक व दर्द निवारक (पेट दर्द व पीरियड्स ऐंठन)',
    tag: 'Fever & Pain',
    uses_en: [
      'Relief from sharp abdominal spasms and stomach cramps',
      'Primary relief for menstrual pain and period cramps (dysmenorrhea)',
      'Spasms caused by intestinal colic, kidney stones, or gallstones',
    ],
    uses_hi: [
      'पेट में मरोड़, ऐंठन और तेज दर्द से तुरंत राहत',
      'महिलाओं में पीरियड्स (मासिक धर्म) के असहनीय दर्द और ऐंठन में अत्यंत प्रभावी',
      'आंतों की मरोड़, गुर्दे की पथरी या पित्त की थैली के दर्द में आराम',
    ],
    sideEffects_en: {
      common: ['Dry mouth, mild drowsiness, blurred vision, dizziness'],
      serious: ['Excessive sleepiness, urinary retention, severe allergy'],
    },
    sideEffects_hi: {
      common: ['मुंह सूखना, हल्का आलस्य, धुंधला दिखना, चक्कर आना'],
      serious: ['अत्यधिक नींद, पेशाब रुकना, गंभीर एलर्जी'],
    },
    howToUse_en: 'Take one tablet with water strictly after food when pain starts. Do not exceed prescribed limit.',
    howToUse_hi: 'दर्द होने पर भोजन के बाद पानी से एक गोली लें। डॉक्टर द्वारा निर्धारित संख्या से अधिक न लें।',
    precautions_en: [
      'May cause drowsiness; avoid driving immediately after consumption.',
      'Always take with food; never take on empty stomach.',
    ],
    precautions_hi: [
      'इससे हल्की नींद या चक्कर आ सकते हैं, इसे लेने के तुरंत बाद गाड़ी न चलाएं।',
      'हमेशा कुछ खाने के बाद ही लें, खाली पेट कभी न लें।',
    ],
    safetyAdvice: {
      pregnancy: { text_en: 'Avoid without doctor consultation', text_hi: 'डॉक्टर की सलाह के बिना न लें', status: 'caution' },
      alcohol: { text_en: 'Unsafe: Enhances drowsiness and dizziness', text_hi: 'असुरक्षित: चक्कर और बेहोशी का जोखिम', status: 'unsafe' },
      driving: { text_en: 'Caution: Can cause blurred vision or drowsiness', text_hi: 'सावधानी: धुंधला दिखना या नींद आ सकती है', status: 'caution' },
      kidneyLiver: { text_en: 'Caution required', text_hi: 'सावधानी आवश्यक', status: 'caution' },
    },
    keywords: ['meftal', 'meftalspas', 'spas', 'pet dard', 'stomach pain', 'cramp', 'period pain', 'colic', 'cyclopam'],
  },

  // ==================== 2. ACIDITY, GAS & STOMACH (गैस, एसिडिटी व पेट की दवाएं) ====================
  {
    id: 'pan-d',
    name: 'Pan-D / Pantocid-D',
    brandNames: ['Pan-D', 'Pantocid-D SR', 'Pantosec-D', 'Pantop-D', 'Dompan'],
    hindiNames: ['पैन डी', 'पेंटोसिड डी', 'गैस', 'एसिडिटी', 'खट्टी डकार', 'उल्टी'],
    salt: 'Pantoprazole (40mg) + Domperidone (30mg SR)',
    category_en: 'Proton Pump Inhibitor + Prokinetic (Acidity & GERD)',
    category_hi: 'गैस व एसिडिटी रोधी दवा (गैस, सीने में जलन व उल्टी)',
    tag: 'Acidity & Gas',
    uses_en: [
      'Treatment of Gastroesophageal Reflux Disease (GERD) and severe acidity',
      'Relief from heartburn, sour belching, bloating, and chest burning',
      'Controls nausea/vomiting associated with acid reflux and indigestion',
    ],
    uses_hi: [
      'गंभीर एसिडिटी, खट्टी डकारें और पेट में भारी गैस की समस्या में आराम',
      'सीने में जलन (Heartburn), गले में खट्टा पानी आने और जी मिचलाने पर प्रभावी',
      'एसिडिटी के कारण होने वाले सिरदर्द और उल्टी की भावना को रोकता है',
    ],
    sideEffects_en: {
      common: ['Dry mouth, mild headache, diarrhea, abdominal pain'],
      serious: ['Heart rhythm irregularities with long unprescribed use', 'Bone weakness with long multi-year usage'],
    },
    sideEffects_hi: {
      common: ['मुंह सूखना, हल्का सिरदर्द, दस्त या पेट में मरोड़'],
      serious: ['बिना डॉक्टर के लंबे समय तक लेने पर दिल की धड़कन अनियमित होना', 'कैल्शियम की कमी'],
    },
    howToUse_en: 'CRITICAL: Take 1 capsule once daily in the MORNING on an EMPTY STOMACH (at least 30-45 minutes before breakfast). Swallow whole; do not chew or crush.',
    howToUse_hi: 'अति आवश्यक: इसे रोज़ सुबह खाली पेट (नाश्ते से 30-45 मिनट पहले) एक गिलास पानी से पूरा निगलें। कैप्सूल को चबाएं या तोड़ें नहीं।',
    precautions_en: [
      'Works best when taken empty stomach in the morning.',
      'Do not chew or break the sustained release (SR) capsule.',
      'Inform your doctor if you have known cardiac arrhythmias.',
    ],
    precautions_hi: [
      'सुबह खाली पेट लेने पर ही यह सर्वोत्तम काम करता है।',
      'कैप्सूल को कभी चबाकर या खोलकर न खाएं।',
      'यदि आपको दिल की बीमारी है, तो डॉक्टर को पहले अवश्य बताएं।',
    ],
    safetyAdvice: {
      pregnancy: { text_en: 'Consult doctor before taking', text_hi: 'लेने से पहले डॉक्टर से परामर्श लें', status: 'caution' },
      alcohol: { text_en: 'Avoid: Alcohol triggers stomach acid secretion', text_hi: 'परहेज करें: शराब एसिडिटी को बहुत बढ़ा देती है', status: 'caution' },
      driving: { text_en: 'Generally safe', text_hi: 'सामान्यतः सुरक्षित', status: 'safe' },
      kidneyLiver: { text_en: 'Safe at normal doses', text_hi: 'सामान्य खुराक में सुरक्षित', status: 'safe' },
    },
    keywords: ['pan d', 'pand', 'pantoprazole', 'pantocid', 'acidity', 'gas', 'heartburn', 'khatti dakar', 'vomit', 'gerd'],
  },

  {
    id: 'pan-40',
    name: 'Pan 40 / Pantocid 40',
    brandNames: ['Pan 40', 'Pantocid 40', 'Pantodac', 'Pantop 40', 'Pantosec', 'Pantoprazole'],
    hindiNames: ['पैन 40', 'पेंटोसिड 40', 'पेंटाप्रोजोल', 'तेजाब', 'पेट में जलन'],
    salt: 'Pantoprazole (40mg)',
    category_en: 'Proton Pump Inhibitor (Acid Reducer)',
    category_hi: 'एसिड कम करने वाली दवा (प्रोटॉन पंप इनहिबिटर)',
    tag: 'Acidity & Gas',
    uses_en: [
      'Reduces excess stomach acid secretion',
      'Heals stomach and intestinal ulcers',
      'Prevents stomach irritation caused by painkillers and antibiotics',
    ],
    uses_hi: [
      'पेट में बनने वाले अत्यधिक एसिड (तेजाब) को कम करता है',
      'पेट और आंतों के छालों (पेप्टिक अल्सर) को ठीक करता है',
      'दर्द की दवाइयों या एंटीबायोटिक्स से होने वाली एसिडिटी और जलन से बचाव करता है',
    ],
    sideEffects_en: {
      common: ['Headache, mild dizziness, flatulence, constipation or loose stools'],
      serious: ['Vitamin B12 deficiency with long uninterrupted usage'],
    },
    sideEffects_hi: {
      common: ['हल्का सिरदर्द, पेट में गैस, कब्ज या पतले दस्त'],
      serious: ['सालों तक लगातार लेने पर विटामिन B12 व मैग्नीशियम की कमी'],
    },
    howToUse_en: 'Take once daily in the morning, 30 minutes before breakfast with water.',
    howToUse_hi: 'रोजाना सुबह नाश्ते से 30 मिनट पहले खाली पेट एक गोली पानी के साथ लें।',
    precautions_en: ['Take 30 minutes prior to eating for optimal enzyme blocking.'],
    precautions_hi: ['नाश्ता करने से आधा घंटा पहले लेने पर ही पूरा लाभ मिलता है।'],
    safetyAdvice: {
      pregnancy: { text_en: 'Prescription needed', text_hi: 'डॉक्टर की सलाह अनुसार लें', status: 'caution' },
      alcohol: { text_en: 'Avoid', text_hi: 'बचें', status: 'caution' },
      driving: { text_en: 'Safe', text_hi: 'सुरक्षित', status: 'safe' },
      kidneyLiver: { text_en: 'Safe', text_hi: 'सुरक्षित', status: 'safe' },
    },
    keywords: ['pan 40', 'pan40', 'pantocid', 'pantoprazole', 'gas', 'acidity', 'tezaab', 'ulcer'],
  },

  {
    id: 'omez',
    name: 'Omez / Omeprazole',
    brandNames: ['Omez', 'Omee', 'Omeprazole 20', 'Omez-D'],
    hindiNames: ['ओमेज', 'ओमी', 'ओमेप्राजोल', 'गैस का कैप्सूल'],
    salt: 'Omeprazole (20mg)',
    category_en: 'Proton Pump Inhibitor (Gastric Acid Reducer)',
    category_hi: 'गैस व अल्सर निवारक कैप्सूल',
    tag: 'Acidity & Gas',
    uses_en: [
      'Rapid relief from heartburn, acid indigestion, and peptic ulcers',
      'Protects stomach lining when taking strong medications',
    ],
    uses_hi: [
      'सीने में जलन, खट्टी डकारें, पेट के छालों और अपच में अत्यंत असरदार',
      'एंटीबायोटिक या दर्द की दवाओं से पेट की अंदरूनी परत को सुरक्षित रखता है',
    ],
    sideEffects_en: {
      common: ['Headache, abdominal pain, constipation, flatulence'],
      serious: ['Rare bone density loss with continuous multi-year use'],
    },
    sideEffects_hi: {
      common: ['सिरदर्द, पेट में दर्द या गैस, कब्ज'],
      serious: ['सालों तक लगातार बिना डॉक्टर के लेने पर हड्डियां कमजोर होना'],
    },
    howToUse_en: 'Take 1 capsule once daily in the morning on an empty stomach.',
    howToUse_hi: 'रोज सुबह खाली पेट 1 कैप्सूल पानी से लें।',
    precautions_en: ['Swallow whole with water; do not open capsule.'],
    precautions_hi: ['कैप्सूल को साबुत निगलें, खोलें या चबाएं नहीं।'],
    safetyAdvice: {
      pregnancy: { text_en: 'Generally prescribed when needed', text_hi: 'डॉक्टर से पूछकर लें', status: 'safe' },
      alcohol: { text_en: 'Avoid', text_hi: 'परहेज करें', status: 'caution' },
      driving: { text_en: 'Safe', text_hi: 'सुरक्षित', status: 'safe' },
      kidneyLiver: { text_en: 'Safe', text_hi: 'सुरक्षित', status: 'safe' },
    },
    keywords: ['omez', 'omee', 'omeprazole', 'acidity', 'gas', 'heartburn', 'capsule'],
  },

  {
    id: 'aciloc',
    name: 'Aciloc / Ranitidine',
    brandNames: ['Aciloc 150', 'Aciloc 300', 'Rantac', 'Zinetac', 'Ranitidine'],
    hindiNames: ['ऐसीलॉक', 'रैनटैक', 'रैनिटिडाइन', 'गैस की गोली'],
    salt: 'Ranitidine (150mg / 300mg)',
    category_en: 'H2 Receptor Antagonist (Acid Reducer)',
    category_hi: 'H2 ब्लॉकर (पेट का तेजाब कम करने वाली दवा)',
    tag: 'Acidity & Gas',
    uses_en: [
      'Fast relief from stomach acidity, heartburn, and sour stomach',
      'Heals duodenal and gastric ulcers',
    ],
    uses_hi: [
      'एसिडिटी, सीने की जलन, खट्टी डकार और पेट के भारीपन में तुरंत आराम',
      'पेट और आंतों के अल्सर को ठीक करने में सहायक',
    ],
    sideEffects_en: {
      common: ['Mild headache, tiredness, dizziness, mild diarrhea'],
      serious: ['Rare allergic reactions'],
    },
    sideEffects_hi: {
      common: ['हल्का सिरदर्द, थकान, चक्कर या हल्का दस्त'],
      serious: ['दुर्लभ एलर्जी'],
    },
    howToUse_en: 'Take 1 tablet before meals or before bedtime as advised by doctor.',
    howToUse_hi: 'डॉक्टर की सलाह अनुसार खाने से पहले या रात को सोते समय लें।',
    precautions_en: ['Do not exceed recommended dose.'],
    precautions_hi: ['तय खुराक से अधिक न लें।'],
    safetyAdvice: {
      pregnancy: { text_en: 'Used under doctor supervision', text_hi: 'डॉक्टर की देखरेख में सुरक्षित', status: 'safe' },
      alcohol: { text_en: 'Avoid', text_hi: 'बचें', status: 'caution' },
      driving: { text_en: 'Safe', text_hi: 'सुरक्षित', status: 'safe' },
      kidneyLiver: { text_en: 'Dose adjustment in kidney disease', text_hi: 'किडनी मरीज खुराक कम लें', status: 'caution' },
    },
    keywords: ['aciloc', 'rantac', 'zinetac', 'ranitidine', 'acidity', 'gas', 'tezaab', 'heartburn'],
  },

  {
    id: 'rabekind-d',
    name: 'Rabekind-D / Razo-D',
    brandNames: ['Rabekind-D', 'Razo-D', 'Happi-D', 'Rabicip-D', 'Rabeprazole'],
    hindiNames: ['रेबेकाइंड', 'रेज़ो डी', 'हैप्पी डी', 'गैस कैप्सूल'],
    salt: 'Rabeprazole (20mg) + Domperidone (30mg SR)',
    category_en: 'PPI + Antiemetic (Fast Acidity & Regurgitation Relief)',
    category_hi: 'तेज असरदार गैस व उल्टी रोधी दवा',
    tag: 'Acidity & Gas',
    uses_en: [
      'Fastest-acting proton pump inhibitor for burning acidity and severe GERD',
      'Stops food and acid regurgitation into throat and mouth',
    ],
    uses_hi: [
      'तेज असर वाली गैस की दवा, गले में खट्टा पानी आने और सीने की जलन में तुरंत आराम',
      'एसिडिटी से सिर चकराने और उल्टी जैसी भावना को रोकता है',
    ],
    sideEffects_en: {
      common: ['Dry mouth, headache, loose stools'],
      serious: ['Dizziness with overdose'],
    },
    sideEffects_hi: {
      common: ['मुंह सूखना, सिरदर्द, हल्का दस्त'],
      serious: ['ओवरडोज पर चक्कर'],
    },
    howToUse_en: 'Take 1 capsule once daily in the morning, 30-45 minutes before breakfast.',
    howToUse_hi: 'रोजाना सुबह नाश्ते से आधा घंटा पहले खाली पेट 1 कैप्सूल लें।',
    precautions_en: ['Swallow whole on empty stomach.'],
    precautions_hi: ['खाली पेट एक गिलास पानी से पूरा निगलें।'],
    safetyAdvice: {
      pregnancy: { text_en: 'Doctor consultation required', text_hi: 'डॉक्टर से पूछें', status: 'caution' },
      alcohol: { text_en: 'Avoid', text_hi: 'बचें', status: 'caution' },
      driving: { text_en: 'Safe', text_hi: 'सुरक्षित', status: 'safe' },
      kidneyLiver: { text_en: 'Safe', text_hi: 'सुरक्षित', status: 'safe' },
    },
    keywords: ['rabekind', 'razo', 'razo d', 'rabeprazole', 'happi', 'acidity', 'gas', 'gerd'],
  },

  {
    id: 'digene',
    name: 'Digene / Gelusil',
    brandNames: ['Digene', 'Gelusil', 'Gas-O-Fast', 'ENO', 'Pudin Hara'],
    hindiNames: ['डाइजीन', 'गेलुसिल', 'इनो', 'पुदीन हरा', 'गैस सिरप'],
    salt: 'Magnesium Hydroxide + Aluminium Hydroxide + Simethicone',
    category_en: 'Antacid & Antiflatulent (Instant Gas Relief)',
    category_hi: 'एंटासिड व गैस नाशक (त्वरित आराम)',
    tag: 'Acidity & Gas',
    uses_en: [
      'Provides quick temporary relief from burning stomach, heartburn, and sour throat',
      'Simethicone breaks trapped gas bubbles to relieve stomach bloating',
      'Soothes acid irritation after spicy or heavy meals',
    ],
    uses_hi: [
      'सीने में तेज जलन, खट्टी डकार और पेट की जलन में तुरंत 5 मिनट में आराम',
      'पेट में फंसी गैस के बुलबुले फोड़कर पेट फूलने और भारीपन से राहत',
      'तीखा, तला-भुना खाने के बाद होने वाली बेचैनी को शांत करता है',
    ],
    sideEffects_en: {
      common: ['Chalky taste in mouth, mild diarrhea or constipation'],
      serious: ['High magnesium in chronic kidney patients'],
    },
    sideEffects_hi: {
      common: ['मुंह में चूने जैसा स्वाद, हल्का दस्त या कब्ज'],
      serious: ['किडनी के गंभीर रोगियों में मैग्नीशियम की मात्रा बढ़ सकती है'],
    },
    howToUse_en: 'Chew 1-2 tablets thoroughly before swallowing, or take 1-2 teaspoons of syrup after meals and before bedtime.',
    howToUse_hi: '1 से 2 गोली अच्छी तरह चबाकर निगलें, या 1-2 चम्मच सीरप खाना खाने के बाद या सोते समय लें।',
    precautions_en: [
      'Do not take within 2 hours of other oral antibiotics (interferes with absorption).',
      'Only meant for symptomatic relief; not a permanent cure for ulcers.',
    ],
    precautions_hi: [
      'अन्य एंटीबायोटिक दवाओं के साथ न लें (कम से कम 2 घंटे का अंतर रखें)।',
      'यह केवल तुरंत राहत के लिए है, लगातार हफ्तों तक इस पर निर्भर न रहें।',
    ],
    safetyAdvice: {
      pregnancy: { text_en: 'Generally safe in moderate amounts; avoid high sodium types', text_hi: 'सीमित मात्रा में सुरक्षित', status: 'safe' },
      alcohol: { text_en: 'Safe but alcohol triggers acid', text_hi: 'सुरक्षित पर शराब से परहेज रखें', status: 'caution' },
      driving: { text_en: 'Safe', text_hi: 'सुरक्षित', status: 'safe' },
      kidneyLiver: { text_en: 'Caution with aluminium/magnesium in renal failure', text_hi: 'किडनी रोगी डॉक्टर से पूछें', status: 'caution' },
    },
    keywords: ['digene', 'gelusil', 'eno', 'antacid', 'gas', 'bloating', 'seene me jalan', 'heartburn', 'syrup', 'pudin hara'],
  },

  {
    id: 'ondem-4',
    name: 'Ondem 4 / Emeset',
    brandNames: ['Ondem 4', 'Emeset 4', 'Vomikind 4', 'Zofran', 'Domstal'],
    hindiNames: ['ओन्डेम', 'एमैसेट', 'वोमिकाइंड', 'उल्टी की दवा', 'जी मिचलाना'],
    salt: 'Ondansetron (4mg)',
    category_en: 'Antiemetic (Nausea & Vomiting Stopper)',
    category_hi: 'एंटीमेटिक (उल्टी व मतली रोकने की दवा)',
    tag: 'Acidity & Gas',
    uses_en: [
      'Stops sudden severe vomiting and continuous retching',
      'Controls nausea due to food poisoning, gastroenteritis, surgery, or chemotherapy',
      'Useful for preventing travel-induced nausea',
    ],
    uses_hi: [
      'लगातार आ रही उल्टी और जी मिचलाने को तुरंत रोकता है',
      'फूड पॉइजनिंग, पेट के संक्रमण (गैस्ट्रो), सर्जरी या दवाओं से होने वाली उल्टी में असरदार',
      'सफर में जी घबराने और उल्टी की समस्या में लाभकारी',
    ],
    sideEffects_en: {
      common: ['Mild headache, constipation, sensation of flushing or warmth'],
      serious: ['Rare heart rhythm changes (QT prolongation)'],
    },
    sideEffects_hi: {
      common: ['हल्का सिरदर्द, कब्ज, शरीर में गर्मी का अहसास'],
      serious: ['हार्ट रिदम में बदलाव (अत्यधिक दुर्लभ)'],
    },
    howToUse_en: 'Take one mouth-dissolving tablet on tongue or swallow with water 30 minutes before food or travel.',
    howToUse_hi: 'एक गोली जीभ पर रखें (घुलने वाली) या पानी से निगलें। सफर या खाने से 30 मिनट पहले लेना बेहतर है।',
    precautions_en: ['Stay hydrated with ORS to prevent dehydration.'],
    precautions_hi: ['उल्टी रुकने के बाद पानी की कमी दूर करने के लिए ओआरएस (ORS) घोल पिएं।'],
    safetyAdvice: {
      pregnancy: { text_en: 'Prescribed for severe morning sickness under gynaecologist', text_hi: 'प्रेग्नेंसी में डॉक्टर की सलाह पर दी जाती है', status: 'caution' },
      alcohol: { text_en: 'Avoid', text_hi: 'बचें', status: 'caution' },
      driving: { text_en: 'Safe', text_hi: 'सुरक्षित', status: 'safe' },
      kidneyLiver: { text_en: 'Caution in severe liver disease', text_hi: 'गंभीर लिवर बीमारी में कम खुराक लें', status: 'caution' },
    },
    keywords: ['ondem', 'emeset', 'vomikind', 'vomiting', 'ulti', 'nausea', 'ji machalna', 'travel sickness', 'domstal'],
  },

  {
    id: 'electral-ors',
    name: 'Electral / ORS',
    brandNames: ['Electral', 'Walyte', 'Prolyte', 'WHO-ORS'],
    hindiNames: ['इलेक्ट्राल', 'ओआरएस', 'दस्त का पानी', 'कमजोरी', 'लू लगना'],
    salt: 'WHO Oral Rehydration Salts (Sodium Chloride, Potassium Chloride, Sodium Citrate, Dextrose)',
    category_en: 'Oral Electrolyte Replacement (Dehydration Solution)',
    category_hi: 'ओआरएस घोल (डिहाइड्रेशन व कमजोरी दूर करने वाला)',
    tag: 'Acidity & Gas',
    uses_en: [
      'Restores lost water and vital electrolytes during loose motions (diarrhea) and vomiting',
      'Treats heat exhaustion, sunstroke, and dehydration caused by heavy sweating',
      'Restores energy during fever and physical fatigue',
    ],
    uses_hi: [
      'दस्त (लूज मोशन) और उल्टी के दौरान शरीर से निकले पानी और जरूरी लवणों की भरपाई करता है',
      'गर्मियों में लू लगना (सनस्ट्रोक), अत्यधिक पसीना और डिहाइड्रेशन में जीवन रक्षक',
      'बीमारी या कमजोरी के बाद शरीर में तुरंत ऊर्जा और इलेक्ट्रोलाइट बैलेंस लौटाता है',
    ],
    sideEffects_en: {
      common: ['None when mixed in correct proportion'],
      serious: ['Electrolyte imbalance if prepared with too little water'],
    },
    sideEffects_hi: {
      common: ['सही मात्रा में पानी मिलाकर पीने पर कोई साइड इफेक्ट नहीं'],
      serious: ['बहुत कम पानी में ज्यादा पाउडर घोलने पर शरीर में नमक की मात्रा बढ़ सकती है'],
    },
    howToUse_en: 'Dissolve entire packet (21.8g) in EXACTLY 1 liter of clean drinking water. Drink in small sips throughout the day. Discard prepared solution after 24 hours.',
    howToUse_hi: 'पूरा एक पैकेट ठीक 1 लीटर साफ पीने के पानी में अच्छी तरह घोलें। पूरे दिन घूंट-घूंट करके पिएं। बना हुआ घोल 24 घंटे के अंदर ही इस्तेमाल करें।',
    precautions_en: ['Mix only in clean water; do not boil prepared solution.'],
    precautions_hi: ['केवल सादे पीने के पानी में ही घोलें, दोबारा न उबालें।'],
    safetyAdvice: {
      pregnancy: { text_en: '100% Safe', text_hi: 'पूरी तरह सुरक्षित', status: 'safe' },
      alcohol: { text_en: 'Safe', text_hi: 'सुरक्षित', status: 'safe' },
      driving: { text_en: 'Safe', text_hi: 'सुरक्षित', status: 'safe' },
      kidneyLiver: { text_en: 'Caution in kidney failure', text_hi: 'किडनी रोगी ध्यान रखें', status: 'caution' },
    },
    keywords: ['electral', 'ors', 'dehydration', 'loose motion', 'dast', 'paani ki kami', 'energy', 'lu lagna', 'vomiting hydration'],
  },

  {
    id: 'dulcolax',
    name: 'Dulcolax / Cremaffin',
    brandNames: ['Dulcolax', 'Cremaffin', 'Kayachurna', 'Isabgol', 'Bisacodyl'],
    hindiNames: ['डल्कोलेक्स', 'क्रेमाफिन', 'कब्ज', 'पेट साफ', 'इसाबगोल'],
    salt: 'Bisacodyl (5mg) / Liquid Paraffin + Milk of Magnesia',
    category_en: 'Laxative (Constipation Relief)',
    category_hi: 'कब्ज निवारक दवा (पेट साफ करने वाली)',
    tag: 'Acidity & Gas',
    uses_en: [
      'Relief from acute and chronic constipation',
      'Bowel evacuation before medical examinations or surgeries',
    ],
    uses_hi: [
      'कब्ज (Constipation) और सख्त पेट से राहत, सुबह पेट साफ करने में मददगार',
      'बवासीर (Piles) के मरीजों में शौच को नरम बनाने में उपयोगी',
    ],
    sideEffects_en: {
      common: ['Abdominal cramps, diarrhea, mild nausea'],
      serious: ['Electrolyte imbalance if abused regularly'],
    },
    sideEffects_hi: {
      common: ['पेट में मरोड़, दस्त, मतली'],
      serious: ['रोज-रोज लेने पर आंतों की आदत पड़ जाना'],
    },
    howToUse_en: 'Take 1 to 2 tablets at night with water. Action begins in 6 to 8 hours.',
    howToUse_hi: 'रात को सोने से पहले 1 या 2 गोली पानी से लें। सुबह 6 से 8 घंटे में पेट साफ हो जाता है।',
    precautions_en: ['Do not use continuously for more than 5 days. Drink lots of water.'],
    precautions_hi: ['लगातार 5 दिन से ज्यादा न लें। दिन में खूब पानी और फाइबर युक्त भोजन लें।'],
    safetyAdvice: {
      pregnancy: { text_en: 'Avoid without doctor advice', text_hi: 'डॉक्टर से पूछें', status: 'caution' },
      alcohol: { text_en: 'Safe', text_hi: 'सुरक्षित', status: 'safe' },
      driving: { text_en: 'Safe', text_hi: 'सुरक्षित', status: 'safe' },
      kidneyLiver: { text_en: 'Safe', text_hi: 'सुरक्षित', status: 'safe' },
    },
    keywords: ['dulcolax', 'cremaffin', 'bisacodyl', 'kabz', 'constipation', 'pet saaf', 'isabgol', 'laxative'],
  },

  // ==================== 3. ALLERGY, COLD & COUGH (सर्दी, खांसी व एलर्जी) ====================
  {
    id: 'cetirizine',
    name: 'Cetirizine / Cetzine',
    brandNames: ['Cetzine', 'Alerid', 'Okacet', 'Zyrtec', 'Cetirizine 10'],
    hindiNames: ['सिट्रीजीन', 'सेटजिन', 'अलेरिड', 'ओकासेट', 'छींक', 'खुजली', 'एलर्जी'],
    salt: 'Cetirizine Hydrochloride (10mg)',
    category_en: 'Antihistamine (Allergy & Itching Relief)',
    category_hi: 'एंटीहिस्टामाइन (एलर्जी, खुजली व छींक की दवा)',
    tag: 'Allergy & Cold',
    uses_en: [
      'Relief from frequent sneezing, runny nose, and watery itchy eyes',
      'Relieves skin hives (urticaria), intense itching, and allergic rashes',
      'Controls allergic reactions from dust, pollen, or insect bites',
    ],
    uses_hi: [
      'लगातार छींकें आना, बहती नाक, आंखों से पानी आना और गले में खुजली में आराम',
      'त्वचा पर पित्ती (उर्टिकेरिया), दाने, खुजली और एलर्जी के चकत्तों को शांत करता है',
      'धूल-मिट्टी, परागकण या कीड़े के काटने से हुई एलर्जी में राहत',
    ],
    sideEffects_en: {
      common: ['Drowsiness, dry mouth, tiredness, mild headache'],
      serious: ['Difficulty in urination in patients with enlarged prostate'],
    },
    sideEffects_hi: {
      common: ['नींद या सुस्ती आना, मुंह सूखना, थकान महसूस होना'],
      serious: ['प्रोस्टेट के मरीजों में पेशाब में रुकावट (दुर्लभ)'],
    },
    howToUse_en: 'Take one 10mg tablet once daily, preferably at NIGHT before bed due to potential drowsiness.',
    howToUse_hi: 'रोजाना रात को सोने से पहले 1 गोली पानी से लें, क्योंकि इससे थोड़ी नींद या सुस्ती आ सकती है।',
    precautions_en: [
      'Causes moderate drowsiness; avoid operating heavy machinery or fast driving.',
      'Never consume alcohol with Cetirizine as it severely increases sedation.',
    ],
    precautions_hi: [
      'इसे लेने के बाद सुस्ती आ सकती है, इसलिए भारी मशीनरी या तेज गाड़ी न चलाएं।',
      'इसके साथ शराब का सेवन बिल्कुल न करें, इससे बेहोशी जैसी नींद आ सकती है।',
    ],
    safetyAdvice: {
      pregnancy: { text_en: 'Generally prescribed if necessary; consult gynaecologist', text_hi: 'जरूरी होने पर डॉक्टर की सलाह से ली जा सकती है', status: 'safe' },
      alcohol: { text_en: 'Unsafe: Compounded severe drowsiness', text_hi: 'असुरक्षित: अत्यधिक नींद और सुस्ती', status: 'unsafe' },
      driving: { text_en: 'Caution: Can impair alertness and reflexes', text_hi: 'सावधानी: ध्यान भटक सकता है और नींद आ सकती है', status: 'caution' },
      kidneyLiver: { text_en: 'Reduce dose (5mg) in kidney impairment', text_hi: 'किडनी की कमजोरी में 5mg डोज लें', status: 'caution' },
    },
    keywords: ['cetirizine', 'cetzine', 'alerid', 'okacet', 'sneezing', 'cheenk', 'khujli', 'itching', 'allergy', 'sardi'],
  },

  {
    id: 'montair-lc',
    name: 'Montair-LC / Montek-LC',
    brandNames: ['Montair-LC', 'Montek-LC', 'Telekast-L', 'Monticope', 'Levocetirizine M'],
    hindiNames: ['मॉन्टेयर एलसी', 'मोंटेक एलसी', 'एलर्जी खांसी', 'अस्थमा'],
    salt: 'Levocetirizine (5mg) + Montelukast (10mg)',
    category_en: 'Antiallergic & Leukotriene Receptor Antagonist',
    category_hi: 'एंटी-एलर्जिक व सांस-दमा एलर्जी रोधी दवा',
    tag: 'Allergy & Cold',
    uses_en: [
      'Relief from seasonal allergic rhinitis, chronic allergic cough, and sneezing',
      'Reduces airway inflammation and nighttime coughing',
      'Provides relief from allergic asthma triggers and chest congestion',
    ],
    uses_hi: [
      'मौसम बदलने पर होने वाली पुरानी एलर्जी, जुकाम, बार-बार छींकें और बहती नाक में आराम',
      'रात के समय होने वाली सूखी एलर्जी वाली खांसी और सांस नली की सूजन को कम करता है',
      'एलर्जिक अस्थमा और छाती में जकड़न के लक्षणों को शांत करता है',
    ],
    sideEffects_en: {
      common: ['Drowsiness, headache, fatigue, dry mouth'],
      serious: ['Unusual mood changes or vivid dreams (rare)'],
    },
    sideEffects_hi: {
      common: ['नींद आना, सिर भारी होना, थकान, मुंह सूखना'],
      serious: ['मूड में बदलाव या अजीब सपने आना (अत्यंत दुर्लभ)'],
    },
    howToUse_en: 'Take 1 tablet once daily in the EVENING or at NIGHT with or without food.',
    howToUse_hi: 'रोजाना शाम को या रात को सोने से पहले 1 गोली लें। इसे खाने के साथ या बिना भी लिया जा सकता है।',
    precautions_en: ['Take at night because Levocetirizine causes mild drowsiness.'],
    precautions_hi: ['इसे रात में ही लें क्योंकि इससे हल्की नींद आ सकती है।'],
    safetyAdvice: {
      pregnancy: { text_en: 'Consult doctor before use', text_hi: 'डॉक्टर से परामर्श के बाद ही लें', status: 'caution' },
      alcohol: { text_en: 'Unsafe: Increases sleepiness', text_hi: 'असुरक्षित: सुस्ती और चक्कर बढ़ाता है', status: 'unsafe' },
      driving: { text_en: 'Caution: Avoid driving if drowsy', text_hi: 'सावधानी: नींद महसूस हो तो गाड़ी न चलाएं', status: 'caution' },
      kidneyLiver: { text_en: 'Caution in severe renal impairment', text_hi: 'किडनी के मरीज सावधानी बरतें', status: 'caution' },
    },
    keywords: ['montair lc', 'montek lc', 'levocetirizine', 'montelukast', 'allergic cough', 'asthma', 'cheenk', 'cough', 'khansi'],
  },

  {
    id: 'allegra',
    name: 'Allegra / Fexofenadine',
    brandNames: ['Allegra 120', 'Allegra 180', 'Fexova', 'Fexofenadine'],
    hindiNames: ['एलेग्रा', 'फेक्सोफेनाडाइन', 'एलर्जी', 'बिना नींद वाली एलर्जी की दवा'],
    salt: 'Fexofenadine Hydrochloride (120mg / 180mg)',
    category_en: 'Non-Sedating Antihistamine',
    category_hi: 'गैर-नींद वाली एलर्जी रोधी दवा',
    tag: 'Allergy & Cold',
    uses_en: [
      'Relief from allergy, hay fever, sneezing, and runny nose WITHOUT causing sleepiness or drowsiness',
      'Relief from skin hives and chronic itching',
    ],
    uses_hi: [
      'बिना नींद या सुस्ती लाए एलर्जी, छींकों, बहती नाक और आंखों की जलन में पूरा आराम',
      'त्वचा की पुरानी पित्ती (पित्ती उछलना) और खुजली में अत्यंत असरदार',
    ],
    sideEffects_en: {
      common: ['Headache, nausea, dry throat'],
      serious: ['Rare hypersensitivity'],
    },
    sideEffects_hi: {
      common: ['हल्का सिरदर्द, मतली'],
      serious: ['दुर्लभ एलर्जी'],
    },
    howToUse_en: 'Take 1 tablet once daily with water. Do not take with fruit juices (apple/orange juice reduces absorption).',
    howToUse_hi: 'रोज 1 गोली पानी के साथ लें। इसे सेब या संतरे के जूस के साथ न लें क्योंकि जूस दवा के असर को कम करता है।',
    precautions_en: ['Avoid fruit juice for 4 hours before and after tablet.'],
    precautions_hi: ['दवा लेने के आसपास फलों का जूस न पिएं।'],
    safetyAdvice: {
      pregnancy: { text_en: 'Safe under doctor advice', text_hi: 'डॉक्टर से पूछकर लें', status: 'safe' },
      alcohol: { text_en: 'Safe compared to other antihistamines', text_hi: 'अन्य एलर्जी दवाओं से अधिक सुरक्षित', status: 'safe' },
      driving: { text_en: 'Safe: Non-drowsy formulation', text_hi: 'सुरक्षित: नींद नहीं आती', status: 'safe' },
      kidneyLiver: { text_en: 'Dose adjustment in kidney disease', text_hi: 'किडनी रोगी ध्यान रखें', status: 'caution' },
    },
    keywords: ['allegra', 'fexofenadine', 'non drowsy allergy', 'cheenk', 'khujli', 'allergy'],
  },

  {
    id: 'sinarest',
    name: 'Sinarest / Cheston Cold',
    brandNames: ['Sinarest', 'Cheston Cold', 'Solvin Cold', 'Wikoryl', 'Maxtra'],
    hindiNames: ['सिनारेस्ट', 'चेस्टन कोल्ड', 'सोलविन कोल्ड', 'जुकाम', 'सर्दी सिरदर्द'],
    salt: 'Paracetamol + Phenylephrine + Chlorpheniramine Maleate',
    category_en: 'Cold & Flu Multi-Symptom Relief',
    category_hi: 'सर्दी, जुकाम व बंद नाक की दवा',
    tag: 'Allergy & Cold',
    uses_en: [
      'All-in-one relief from heavy head, blocked nose, sneezing, runny nose, and fever',
      'Clears sinus pressure and congestion',
    ],
    uses_hi: [
      'सर्दी, जुकाम, बंद नाक, भारी सिर, छींकें और बुखार का एक साथ इलाज',
      'साइनस के भारीपन और नाक की रुकावट को तेजी से खोलता है',
    ],
    sideEffects_en: {
      common: ['Drowsiness, dry mouth, mild increase in blood pressure'],
      serious: ['Palpitations in high BP patients'],
    },
    sideEffects_hi: {
      common: ['नींद आना, मुंह सूखना, बीपी हल्का बढ़ना'],
      serious: ['हाई बीपी के मरीजों में धड़कन तेज होना'],
    },
    howToUse_en: 'Take 1 tablet twice or thrice daily after meals.',
    howToUse_hi: 'भोजन के बाद 1 गोली दिन में 2 से 3 बार लें।',
    precautions_en: ['High BP patients must check with doctor before taking (contains phenylephrine).'],
    precautions_hi: ['हाई ब्लड प्रेशर के मरीज डॉक्टर से पूछकर ही लें।'],
    safetyAdvice: {
      pregnancy: { text_en: 'Avoid without prescription', text_hi: 'बिना डॉक्टर न लें', status: 'caution' },
      alcohol: { text_en: 'Unsafe', text_hi: 'असुरक्षित', status: 'unsafe' },
      driving: { text_en: 'Caution: Causes drowsiness', text_hi: 'नींद आ सकती है', status: 'caution' },
      kidneyLiver: { text_en: 'Caution', text_hi: 'सावधानी रखें', status: 'caution' },
    },
    keywords: ['sinarest', 'cheston cold', 'wikoryl', 'jukam', 'sardi', 'cold', 'blocked nose', 'band naak', 'flu'],
  },

  {
    id: 'ascoril-d',
    name: 'Ascoril-D / Benadryl (Dry Cough)',
    brandNames: ['Ascoril-D Plus', 'Benadryl DR', 'Alex', 'Zedex', 'Corex-DX'],
    hindiNames: ['एस्कोरिल डी', 'बेनाड्रिल', 'एलेक्स', 'सूखी खांसी का सीरप'],
    salt: 'Dextromethorphan + Chlorpheniramine + Phenylephrine',
    category_en: 'Antitussive (Dry Cough Syrup)',
    category_hi: 'एंटीटसिव (सूखी खांसी का सीरप)',
    tag: 'Allergy & Cold',
    uses_en: [
      'Suppresses irritating dry cough (cough without phlegm / mucus)',
      'Relieves throat tickle, continuous barking cough, and chest scratchiness',
      'Unblocks stuffy nose and relieves watering eyes',
    ],
    uses_hi: [
      'सूखी खांसी (बिना बलगम वाली तेज धंसका खांसी) को तुरंत शांत करता है',
      'गले की खराश, खुजली और लगातार आने वाली खांसी के दौरों में आराम',
      'बंद नाक को खोलता है और आंखों से पानी बहना रोकता है',
    ],
    sideEffects_en: {
      common: ['Drowsiness, dizziness, dry mouth, mild nausea'],
      serious: ['Rapid heart rate, high blood pressure with overdose'],
    },
    sideEffects_hi: {
      common: ['नींद, चक्कर, मुंह सूखना, हल्की मतली'],
      serious: ['ओवरडोज़ लेने पर दिल की धड़कन तेज होना या बीपी बढ़ना'],
    },
    howToUse_en: 'Adults: 5ml to 10ml two to three times daily. Use measuring cup provided. Avoid drinking water for 15 minutes after sipping syrup to coat throat.',
    howToUse_hi: 'वयस्क: 5 से 10 मिली दिन में 2 से 3 बार। सीरप पीने के 15 मिनट बाद तक पानी न पिएं ताकि दवा गले पर लगी रहे।',
    precautions_en: [
      'DO NOT use for productive cough (cough with thick yellow/green phlegm); use expectorants instead.',
      'High blood pressure and heart patients should check with doctor (contains phenylephrine).',
    ],
    precautions_hi: [
      'गीली या बलगम वाली खांसी में इसे न पिएं।',
      'हाई बीपी और दिल के मरीज डॉक्टर की सलाह से ही लें।',
    ],
    safetyAdvice: {
      pregnancy: { text_en: 'Avoid without doctor prescription', text_hi: 'बिना डॉक्टर की सलाह न लें', status: 'caution' },
      alcohol: { text_en: 'Unsafe: Dangerous CNS depression', text_hi: 'असुरक्षित: बहुत अधिक सुस्ती और चक्कर', status: 'unsafe' },
      driving: { text_en: 'Unsafe: Induces sleepiness', text_hi: 'असुरक्षित: नींद आती है, गाड़ी न चलाएं', status: 'unsafe' },
      kidneyLiver: { text_en: 'Caution', text_hi: 'सावधानी रखें', status: 'caution' },
    },
    keywords: ['ascoril d', 'benadryl', 'alex', 'dry cough', 'khansi', 'sukhi khansi', 'cough syrup', 'gala kharab'],
  },

  {
    id: 'ascoril-ls',
    name: 'Ascoril-LS / Grilinctus-BM (Wet Cough)',
    brandNames: ['Ascoril-LS', 'Bro-Zedex', 'Macbery-XT', 'Asthalin', 'Ambroxol'],
    hindiNames: ['एस्कोरिल एलएस', 'बलगम वाली खांसी', 'कफ सीरप'],
    salt: 'Levosalbutamol + Ambroxol + Guaiphenesin',
    category_en: 'Mucolytic & Bronchodilator (Wet / Phlegm Cough)',
    category_hi: 'बलगम निकालने वाला कफ सीरप',
    tag: 'Allergy & Cold',
    uses_en: [
      'Thins, loosens, and expels thick sticky mucus/phlegm from chest',
      'Opens narrowed airways in chest congestion, bronchitis, and asthmatic cough',
    ],
    uses_hi: [
      'छाती में जमा गाढ़ा बलगम पिघलाकर खांसी के रास्ते बाहर निकालता है',
      'छाती की जकड़न, घरघराहट और सांस नली की रुकावट को खोलता है',
    ],
    sideEffects_en: {
      common: ['Hand tremors/shakiness, fast heart rate, headache, nausea'],
      serious: ['Severe palpitations if overdosed'],
    },
    sideEffects_hi: {
      common: ['हाथों में हल्की कंपकंपी, दिल की धड़कन तेज होना, सिरदर्द'],
      serious: ['ओवरडोज पर तेज धड़कन'],
    },
    howToUse_en: '5ml to 10ml two to three times daily after food. Drink lukewarm water to help liquefy mucus.',
    howToUse_hi: '5 से 10 मिली दिन में 2-3 बार भोजन के बाद लें। साथ में गुनगुना पानी पिएं जिससे बलगम आसानी से निकले।',
    precautions_en: ['Heart patients and thyroid patients should consult doctor first.'],
    precautions_hi: ['दिल के मरीज डॉक्टर की सलाह से ही लें।'],
    safetyAdvice: {
      pregnancy: { text_en: 'Consult doctor', text_hi: 'डॉक्टर से पूछें', status: 'caution' },
      alcohol: { text_en: 'Avoid', text_hi: 'बचें', status: 'caution' },
      driving: { text_en: 'Safe unless trembling', text_hi: 'हाथ कांपे तो ड्राइव न करें', status: 'safe' },
      kidneyLiver: { text_en: 'Safe', text_hi: 'सुरक्षित', status: 'safe' },
    },
    keywords: ['ascoril ls', 'grilinctus', 'wet cough', 'phlegm', 'balgam', 'cough syrup', 'chest congestion'],
  },

  {
    id: 'otrivin',
    name: 'Otrivin / Nasivion Nasal Drops',
    brandNames: ['Otrivin 0.1%', 'Nasivion', 'Xylometazoline', 'Oxymetazoline'],
    hindiNames: ['ओट्रिविन', 'नेसीवियन', 'बंद नाक की दवा', 'नाक का स्प्रे'],
    salt: 'Xylometazoline Hydrochloride (0.1% / 0.05%)',
    category_en: 'Nasal Decongestant (Blocked Nose Spray)',
    category_hi: 'बंद नाक खोलने का नेज़ल स्प्रे / ड्रॉप',
    tag: 'Allergy & Cold',
    uses_en: [
      'Instantly opens heavily blocked nose within 2 minutes',
      'Relieves nasal sinus congestion during severe colds and viral flu',
    ],
    uses_hi: [
      '2 मिनट के अंदर बंद नाक को तुरंत खोल देता है, जिससे रात में आराम से सांस ली जा सके',
      'सर्दी, जुकाम और साइनस में नाक की नसों की सूजन को सिकोड़ता है',
    ],
    sideEffects_en: {
      common: ['Nasal burning or dryness, sneezing'],
      serious: ['Severe rebound congestion (rhinitis medicamentosa) if used over 5 days!'],
    },
    sideEffects_hi: {
      common: ['नाक में हल्की जलन या सूखापन, छींक'],
      serious: ['5 दिन से ज्यादा इस्तेमाल करने पर नाक स्थायी रूप से बंद रहने की लत (Rebound Congestion)!'],
    },
    howToUse_en: 'Instill 1-2 drops or 1 spray into each nostril, maximum 2-3 times daily.',
    howToUse_hi: 'प्रत्येक नथुने में 1-2 बूंद या 1 स्प्रे डालें। दिन में अधिकतम 2-3 बार ही प्रयोग करें।',
    precautions_en: ['CRITICAL: NEVER use for more than 4-5 consecutive days! Causes severe rebound blockage.'],
    precautions_hi: ['अति महत्वपूर्ण: इसे लगातार 4-5 दिन से ज्यादा कभी इस्तेमाल न करें! नहीं तो नाक हमेशा बंद रहने की बीमारी हो जाती है।'],
    safetyAdvice: {
      pregnancy: { text_en: 'Avoid high doses; consult doctor', text_hi: 'डॉक्टर से पूछकर ही प्रयोग करें', status: 'caution' },
      alcohol: { text_en: 'Safe', text_hi: 'सुरक्षित', status: 'safe' },
      driving: { text_en: 'Safe', text_hi: 'सुरक्षित', status: 'safe' },
      kidneyLiver: { text_en: 'Safe', text_hi: 'सुरक्षित', status: 'safe' },
    },
    keywords: ['otrivin', 'nasivion', 'band naak', 'blocked nose', 'nasal spray', 'xylometazoline', 'sinus'],
  },

  // ==================== 4. ANTIBIOTICS (एंटीबायोटिक दवाएं) ====================
  {
    id: 'augmentin-625',
    name: 'Augmentin 625 Duo',
    brandNames: ['Augmentin 625', 'Moxikind-CV 625', 'Clavam 625', 'Advent 625', 'Amoxicillin'],
    hindiNames: ['ऑगमेंटिन', 'क्लैवम', 'मोक्सीकाइंड सीवी', 'एंटीबायोटिक', 'इन्फेक्शन'],
    salt: 'Amoxicillin (500mg) + Clavulanic Acid (125mg)',
    category_en: 'Broad Spectrum Penicillin Antibiotic',
    category_hi: 'ब्रॉड स्पेक्ट्रम एंटीबायोटिक (बैक्टीरियल संक्रमण की दवा)',
    tag: 'Antibiotics',
    uses_en: [
      'Treats bacterial infections of lungs, throat, bronchitis, and pneumonia',
      'Ear, nose, and sinus infections (sinusitis, otitis media)',
      'Skin, soft tissue, dental abscess, and urinary tract infections (UTI)',
    ],
    uses_hi: [
      'फेफड़ों, गले, ब्रोंकाइटिस और निमोनिया के बैक्टीरियल संक्रमण का इलाज',
      'कान, नाक और साइनस के संक्रमण (साइनोसाइटिस) में अत्यंत असरदार',
      'त्वचा के फोड़े-फुंसी, दांतों के मवाद (इन्फेक्शन) और यूरिनरी इन्फेक्शन (UTI) में असरदार',
    ],
    sideEffects_en: {
      common: ['Diarrhea / loose stools, nausea, mild stomach cramps, fungal thrush'],
      serious: ['Severe watery diarrhea (C. diff), allergic anaphylaxis (penicillin allergy)'],
    },
    sideEffects_hi: {
      common: ['पतले दस्त, जी मिचलाना, पेट में हल्का मरोड़'],
      serious: ['पेनिसिलिन से एलर्जी होने पर सांस लेने में तकलीफ या चेहरे पर सूजन (तुरंत अस्पताल जाएं)'],
    },
    howToUse_en: 'Take with food or at the start of a meal to reduce stomach upset. Complete FULL 5-day course even if you feel better.',
    howToUse_hi: 'हमेशा भोजन की शुरुआत में या भोजन के साथ लें ताकि पेट खराब न हो। ठीक महसूस होने पर भी 5 दिन का पूरा कोर्स खत्म करें।',
    precautions_en: [
      'CRITICAL: Never stop antibiotics early! Stopping creates antibiotic resistance.',
      'Inform doctor immediately if you are allergic to Penicillin or Amoxicillin.',
      'Take probiotics or curd to replenish healthy gut bacteria.',
    ],
    precautions_hi: [
      'अति महत्वपूर्ण: कोर्स कभी अधूरा न छोड़ें! अधूरा छोड़ने से बैक्टीरिया दवा के प्रति प्रतिरोधी (resistant) बन जाते हैं।',
      'यदि आपको पेनिसिलिन से एलर्जी है तो डॉक्टर को तुरंत बताएं।',
      'पेट ठीक रखने के लिए साथ में दही या प्रोबायोटिक का सेवन करें।',
    ],
    safetyAdvice: {
      pregnancy: { text_en: 'Generally prescribed safely by doctors during pregnancy', text_hi: 'डॉक्टर की देखरेख में गर्भावस्था में सुरक्षित माना जाता है', status: 'safe' },
      alcohol: { text_en: 'Avoid: Reduces antibiotic efficacy and strains liver', text_hi: 'बचें: दवा का असर कम होता है और पेट खराब होता है', status: 'caution' },
      driving: { text_en: 'Safe', text_hi: 'सुरक्षित', status: 'safe' },
      kidneyLiver: { text_en: 'Dose adjustment needed in severe kidney damage', text_hi: 'किडनी की बीमारी में खुराक कम करनी पड़ती है', status: 'caution' },
    },
    keywords: ['augmentin', 'augmentin625', 'clavam', 'moxikind', 'amoxicillin', 'clavulanic', 'antibiotic', 'infection', 'tooth infection', 'throat'],
  },

  {
    id: 'azithral-500',
    name: 'Azithral 500 / Azee',
    brandNames: ['Azithral 500', 'Azee 500', 'Azimax 500', 'Zithrox', 'Azithromycin'],
    hindiNames: ['एजिथ्रल', 'एजी 500', 'गले का इन्फेक्शन', 'टॉन्सिल', 'टाइफाइड'],
    salt: 'Azithromycin (500mg)',
    category_en: 'Macrolide Antibiotic',
    category_hi: 'मैक्रोलाइड एंटीबायोटिक (गले व छाती के संक्रमण की दवा)',
    tag: 'Antibiotics',
    uses_en: [
      'Bacterial throat infections, tonsillitis, pharyngitis, and severe chest infections',
      'Typhoid fever and bacterial skin infections',
      'Specific genital and sexually transmitted bacterial infections',
    ],
    uses_hi: [
      'गले का भयंकर संक्रमण, टॉन्सिल, ग्रसनी शोथ और छाती का कफ इन्फेक्शन',
      'टाइफाइड बुखार और त्वचा के बैक्टीरियल इन्फेक्शन में उपयोगी',
      'श्वसन तंत्र (सांस नली) के जीवाणु संक्रमण को खत्म करता है',
    ],
    sideEffects_en: {
      common: ['Diarrhea, stomach cramps, nausea, vomiting, metallic taste'],
      serious: ['Irregular heart rhythm (rare QT prolongation)'],
    },
    sideEffects_hi: {
      common: ['दस्त, पेट में दर्द, उल्टी, मुंह में कड़वा स्वाद'],
      serious: ['दिल की धड़कन में असामान्य बदलाव (दुर्लभ)'],
    },
    howToUse_en: 'Take ONCE daily at the same time, either 1 hour before food or 2 hours after food. Usually a 3-day or 5-day course.',
    howToUse_hi: 'दिन में सिर्फ एक बार एक निश्चित समय पर लें। खाने से 1 घंटा पहले या खाने के 2 घंटे बाद लेना सर्वोत्तम है। आमतौर पर 3 या 5 दिन का कोर्स होता है।',
    precautions_en: [
      'Do not take antacids (like Digene/Gelusil) simultaneously within 2 hours.',
      'Must complete the exact 3 or 5 day schedule prescribed.',
      'Does not work against common viral colds or flu—only bacterial infections.',
    ],
    precautions_hi: [
      'इसके साथ 2 घंटे तक कोई एंटासिड (जैसे डाइजीन) न लें, यह दवा के असर को रोक देती है।',
      'डॉक्टर द्वारा बताए गए 3 या 5 दिन का पूरा कोर्स खत्म करें।',
      'यह साधारण वायरल सर्दी या फ्लू पर काम नहीं करती—केवल बैक्टीरिया पर काम करती है।',
    ],
    safetyAdvice: {
      pregnancy: { text_en: 'Prescribed only when clearly needed', text_hi: 'केवल डॉक्टर के कहने पर ही लें', status: 'caution' },
      alcohol: { text_en: 'Avoid: May aggravate stomach irritation and dizziness', text_hi: 'बचें: पेट में जलन और चक्कर बढ़ सकते हैं', status: 'caution' },
      driving: { text_en: 'Safe unless experiencing dizziness', text_hi: 'सामान्यतः सुरक्षित', status: 'safe' },
      kidneyLiver: { text_en: 'Caution in severe liver disease', text_hi: 'लिवर रोग में सावधानी रखें', status: 'caution' },
    },
    keywords: ['azithromycin', 'azithral', 'azee', 'tonsil', 'gala kharab', 'throat infection', 'antibiotic', 'typhoid'],
  },

  {
    id: 'ciplox-500',
    name: 'Ciplox 500 / Cifran',
    brandNames: ['Ciplox 500', 'Cifran 500', 'Ciprolet', 'Ciprofloxacin'],
    hindiNames: ['सिपलॉक्स', 'सिफ्रान', 'यूरिन इन्फेक्शन', 'आंख कान की दवा'],
    salt: 'Ciprofloxacin (500mg)',
    category_en: 'Fluoroquinolone Antibiotic (UTI & Typhoid)',
    category_hi: 'फ्लोरोक्विनोलोन एंटीबायोटिक (यूरिन व पेट इन्फेक्शन)',
    tag: 'Antibiotics',
    uses_en: [
      'Urinary tract infections (burning urination / UTI)',
      'Severe infectious diarrhea, typhoid fever, and bone/joint infections',
    ],
    uses_hi: [
      'पेशाब में जलन और यूरिनरी ट्रैक्ट इन्फेक्शन (UTI) में बेहद असरदार',
      'गंभीर बैक्टीरियल दस्त, टाइफाइड बुखार और त्वचा-हड्डी के इन्फेक्शन में उपयोगी',
    ],
    sideEffects_en: {
      common: ['Nausea, diarrhea, headache, dizziness'],
      serious: ['Tendon rupture/pain (especially Achilles tendon)'],
    },
    sideEffects_hi: {
      common: ['मतली, दस्त, सिरदर्द, चक्कर'],
      serious: ['एड़ी की नस (Achilles Tendon) में दर्द या खिंचाव (तुरंत डॉक्टर को बताएं)'],
    },
    howToUse_en: 'Take with full glass of water 2 hours after food. Drink plenty of water throughout the day.',
    howToUse_hi: 'खाना खाने के 2 घंटे बाद पूरे गिलास पानी के साथ लें। दिनभर खूब पानी पिएं।',
    precautions_en: ['Avoid taking with milk, curd, or antacids.'],
    precautions_hi: ['दूध, दही या कैल्शियम के साथ न लें (2 घंटे का अंतर रखें)।'],
    safetyAdvice: {
      pregnancy: { text_en: 'Contraindicated in pregnancy', text_hi: 'गर्भावस्था में मना है', status: 'unsafe' },
      alcohol: { text_en: 'Avoid', text_hi: 'बचें', status: 'caution' },
      driving: { text_en: 'Safe unless dizzy', text_hi: 'चक्कर आए तो ड्राइविंग न करें', status: 'safe' },
      kidneyLiver: { text_en: 'Dose adjustment in renal failure', text_hi: 'किडनी रोगी कम खुराक लें', status: 'caution' },
    },
    keywords: ['ciplox', 'cifran', 'ciprofloxacin', 'uti', 'urine infection', 'peshab me jalan', 'antibiotic'],
  },

  {
    id: 'taxim-o',
    name: 'Taxim-O 200 / Zifi 200',
    brandNames: ['Taxim-O 200', 'Zifi 200', 'Mahacef 200', 'Cefixime'],
    hindiNames: ['टैक्सिम ओ', 'ज़िफी 200', 'महासेफ', 'टाइफाइड', 'एंटीबायोटिक'],
    salt: 'Cefixime (200mg)',
    category_en: 'Cephalosporin Antibiotic',
    category_hi: 'सेफालोस्पोरिन एंटीबायोटिक (टाइफाइड व श्वसन इन्फेक्शन)',
    tag: 'Antibiotics',
    uses_en: [
      'Typhoid fever and complicated urinary tract infections',
      'Throat infections, tonsillitis, and ear infections in children and adults',
    ],
    uses_hi: [
      'टाइफाइड बुखार और यूरिन इन्फेक्शन का प्रमुख इलाज',
      'गले का संक्रमण, टॉन्सिल, कान का इन्फेक्शन और ब्रोंकाइटिस में असरदार',
    ],
    sideEffects_en: {
      common: ['Diarrhea, stomach pain, indigestion'],
      serious: ['Allergic rash'],
    },
    sideEffects_hi: {
      common: ['दस्त, पेट में दर्द, गैस'],
      serious: ['त्वचा पर लाल दाने'],
    },
    howToUse_en: 'Take 1 tablet twice daily with or without food. Complete prescribed course.',
    howToUse_hi: 'दिन में 2 बार 1-1 गोली खाने के बाद लें। पूरा कोर्स खत्म करें।',
    precautions_en: ['Complete 7-10 days for typhoid fever as instructed.'],
    precautions_hi: ['टाइफाइड में डॉक्टर द्वारा बताए गए 7 से 10 दिन पूरे करें।'],
    safetyAdvice: {
      pregnancy: { text_en: 'Safe under doctor advice', text_hi: 'गर्भावस्था में सुरक्षित माना जाता है', status: 'safe' },
      alcohol: { text_en: 'Avoid', text_hi: 'बचें', status: 'caution' },
      driving: { text_en: 'Safe', text_hi: 'सुरक्षित', status: 'safe' },
      kidneyLiver: { text_en: 'Caution', text_hi: 'सावधानी रखें', status: 'caution' },
    },
    keywords: ['taxim o', 'zifi', 'cefixime', 'mahacef', 'typhoid', 'bukhar', 'antibiotic'],
  },

  {
    id: 'oflox-oz',
    name: 'Oflox-OZ / O2',
    brandNames: ['O2', 'Oflox-OZ', 'Zenflox-OZ', 'Ornof', 'Metrogyl', 'Flagyl'],
    hindiNames: ['ओ 2', 'ऑफ्लॉक्स ओजेड', 'मेट्रोजिल', 'दस्त', 'पेचिश', 'पेट इन्फेक्शन'],
    salt: 'Ofloxacin (200mg) + Ornidazole (500mg) / Metronidazole (400mg)',
    category_en: 'Antibacterial & Antiprotozoal (Diarrhea & Dysentery)',
    category_hi: 'दस्त व पेचिश नाशक एंटीबायोटिक (पेट संक्रमण)',
    tag: 'Antibiotics',
    uses_en: [
      'Acute diarrhea, bacterial dysentery, and amoebiasis (loose motions with mucus/blood)',
      'Severe stomach food poisoning and intestinal infections',
      'Dental infections and pelvic gynecological infections',
    ],
    uses_hi: [
      'गंभीर दस्त, पेचिश और अमीबायसिस (आंव या खून वाले पतले दस्त) का अचूक इलाज',
      'खराब खाना या दूषित पानी पीने से हुआ पेट का भयंकर इन्फेक्शन (फूड पॉइजनिंग)',
      'दांतों के मवाद और पेट के निचले हिस्से के संक्रमण में असरदार',
    ],
    sideEffects_en: {
      common: ['Bitter metallic taste in mouth, nausea, loss of appetite, dizziness'],
      serious: ['Tendon pain, severe vomiting if alcohol consumed'],
    },
    sideEffects_hi: {
      common: ['मुंह में कड़वा या धातु जैसा स्वाद, भूख न लगना, उल्टी जैसा मन, चक्कर'],
      serious: ['शराब पीने पर गंभीर रिएक्शन व लगातार उल्टी'],
    },
    howToUse_en: 'Take one tablet twice daily strictly after meals for 3 to 5 days as prescribed.',
    howToUse_hi: 'भोजन करने के बाद दिन में 2 बार (सुबह-शाम) एक-एक गोली पानी से लें। खाली पेट न लें।',
    precautions_en: [
      'CRITICAL: Strictly avoid all alcohol during and 48 hours after treatment (severe reaction).',
      'Drink plenty of fluids/ORS to prevent kidney crystals.',
    ],
    precautions_hi: [
      'अति आवश्यक: दवा के दौरान और खत्म होने के 2 दिन बाद तक शराब को हाथ भी न लगाएं।',
      'दवा के साथ ओआरएस (ORS) और पर्याप्त पानी जरूर पिएं।',
    ],
    safetyAdvice: {
      pregnancy: { text_en: 'Avoid during 1st trimester; consult doctor', text_hi: 'पहली तिमाही में असुरक्षित; डॉक्टर से पूछें', status: 'unsafe' },
      alcohol: { text_en: 'STRICTLY UNSAFE: Severe reaction (flushing, palpitations, vomiting)', text_hi: 'सख्त असुरक्षित: गंभीर रिएक्शन, उल्टी व दिल की तेज धड़कन', status: 'unsafe' },
      driving: { text_en: 'Caution: Can cause dizziness', text_hi: 'सावधानी: चक्कर आ सकते हैं', status: 'caution' },
      kidneyLiver: { text_en: 'Caution', text_hi: 'सावधानी रखें', status: 'caution' },
    },
    keywords: ['o2', 'oflox oz', 'zenflox oz', 'dast', 'pechish', 'loose motion', 'food poisoning', 'pet kharab', 'metrogyl'],
  },

  // ==================== 5. CHRONIC / BP, HEART & DIABETES (बीपी, दिल व शुगर) ====================
  {
    id: 'telma-40',
    name: 'Telma 40 / Telmisartan',
    brandNames: ['Telma 40', 'Telmikind', 'Telpres', 'Micardis', 'Telma-H'],
    hindiNames: ['टेल्मा 40', 'टेल्मीसार्टन', 'बीपी की गोली', 'हाई ब्लड प्रेशर'],
    salt: 'Telmisartan (40mg)',
    category_en: 'Angiotensin Receptor Blocker (Blood Pressure)',
    category_hi: 'एंजियोटेंसिन रिसेप्टर ब्लॉकर (हाई ब्लड प्रेशर की दवा)',
    tag: 'BP & Heart',
    uses_en: [
      'Lowers high blood pressure (hypertension) to reduce heart attack and stroke risk',
      'Protects kidney function in diabetic patients',
      'Reduces strain on heart in chronic heart failure patients',
    ],
    uses_hi: [
      'हाई ब्लड प्रेशर (उच्च रक्तचाप) को नियंत्रित कर हार्ट अटैक और स्ट्रोक के खतरे को कम करता है',
      'डायबिटीज के मरीजों में किडनी को खराब होने से बचाता है',
      'कमजोर दिल पर पड़ने वाले दबाव को कम करता है',
    ],
    sideEffects_en: {
      common: ['Dizziness while standing up, sinus congestion, back pain, tiredness'],
      serious: ['High blood potassium levels (hyperkalemia), low blood pressure'],
    },
    sideEffects_hi: {
      common: ['अचानक खड़े होने पर चक्कर आना, थकान, कमर दर्द'],
      serious: ['खून में पोटेशियम का स्तर बढ़ना, बीपी बहुत ज्यादा गिर जाना'],
    },
    howToUse_en: 'Take ONE tablet once daily at the EXACT same time every day, with or without food.',
    howToUse_hi: 'रोजाना एक ही निश्चित समय पर 1 गोली पानी से लें (चाहे खाली पेट लें या खाने के बाद)।',
    precautions_en: [
      'NEVER stop taking blood pressure medicine abruptly without doctor consultation.',
      'Check BP regularly and maintain a log.',
    ],
    precautions_hi: [
      'बीपी की दवा को कभी भी अचानक अपनी मर्जी से बंद न करें।',
      'नियमित रूप से बीपी चेक करते रहें।',
    ],
    safetyAdvice: {
      pregnancy: { text_en: 'STRICTLY CONTRAINDICATED in pregnancy: Can harm unborn baby', text_hi: 'गर्भावस्था में सख्त मना: गर्भस्थ शिशु के लिए नुकसानदेह', status: 'unsafe' },
      alcohol: { text_en: 'Caution: Can cause dangerously low blood pressure', text_hi: 'सावधानी: बीपी बहुत ज्यादा नीचे गिर सकता है', status: 'caution' },
      driving: { text_en: 'Caution initially if feeling lightheaded', text_hi: 'शुरुआत में चक्कर आए तो ड्राइविंग न करें', status: 'caution' },
      kidneyLiver: { text_en: 'Regular kidney function monitoring advised', text_hi: 'किडनी की नियमित जांच कराते रहें', status: 'caution' },
    },
    keywords: ['telma 40', 'telma40', 'telmisartan', 'bp', 'blood pressure', 'hypertension', 'high bp', 'heart'],
  },

  {
    id: 'amlodipine',
    name: 'Amlokind 5 / Stamlo (Amlodipine)',
    brandNames: ['Amlokind 5', 'Stamlo 5', 'Amlopin', 'Amlodac', 'Amlodipine'],
    hindiNames: ['एम्लोकाइंड', 'स्टैमलो', 'एम्लोडिपिन', 'ब्लड प्रेशर'],
    salt: 'Amlodipine Besylate (5mg / 10mg)',
    category_en: 'Calcium Channel Blocker (Hypertension & Angina)',
    category_hi: 'कैल्शियम चैनल ब्लॉकर (बीपी व सीने के दर्द की दवा)',
    tag: 'BP & Heart',
    uses_en: [
      'Treats high blood pressure and relaxes stiff blood vessels',
      'Prevents chronic chest pain (angina pectoris) caused by lack of blood flow to heart',
    ],
    uses_hi: [
      'हाई ब्लड प्रेशर को कम करता है और सिकुड़ी रक्त नलिकाओं को आराम देता है',
      'दिल में खून का दौरा बढ़ाकर सीने के दर्द (एंजाइना) से बचाव करता है',
    ],
    sideEffects_en: {
      common: ['Swelling in ankles/feet (peripheral edema), flushing, headache, fatigue'],
      serious: ['Excessive low blood pressure, irregular heartbeat'],
    },
    sideEffects_hi: {
      common: ['पैरों के टखनों में सूजन (Edema), चेहरे पर लाली, सिरदर्द, थकान'],
      serious: ['बीपी बहुत कम होना'],
    },
    howToUse_en: 'Take once daily at the same time with water.',
    howToUse_hi: 'रोजाना एक ही समय पर 1 गोली पानी से लें।',
    precautions_en: ['If feet swell significantly, report to your doctor for dose adjustment.'],
    precautions_hi: ['यदि पैरों में ज्यादा सूजन दिखे तो डॉक्टर को बताएं।'],
    safetyAdvice: {
      pregnancy: { text_en: 'Consult doctor', text_hi: 'डॉक्टर से पूछें', status: 'caution' },
      alcohol: { text_en: 'Caution', text_hi: 'सावधानी रखें', status: 'caution' },
      driving: { text_en: 'Safe unless dizzy', text_hi: 'सुरक्षित', status: 'safe' },
      kidneyLiver: { text_en: 'Safe', text_hi: 'सुरक्षित', status: 'safe' },
    },
    keywords: ['amlodipine', 'amlokind', 'stamlo', 'bp', 'blood pressure', 'hypertension', 'high bp', 'ankles swelling'],
  },

  {
    id: 'atorvastatin',
    name: 'Atorva 10 / Storvas (Atorvastatin)',
    brandNames: ['Atorva 10', 'Storvas 10', 'Lipitor', 'Atocor', 'Rosuvas', 'Rosuvastatin'],
    hindiNames: ['अटोरवा', 'स्टोरवास', 'कोलेस्ट्रॉल', 'खून में चर्बी', 'हार्ट अटैक से बचाव'],
    salt: 'Atorvastatin Calcium (10mg / 20mg / 40mg)',
    category_en: 'Statin / HMG-CoA Reductase Inhibitor (Cholesterol Reducer)',
    category_hi: 'कोलेस्ट्रॉल कम करने वाली दवा (हृदय सुरक्षा)',
    tag: 'BP & Heart',
    uses_en: [
      'Lowers "bad" LDL cholesterol and triglycerides in blood',
      'Raises "good" HDL cholesterol and prevents blockages in heart arteries',
      'Significantly cuts heart attack and stroke risks',
    ],
    uses_hi: [
      'खून में खराब कोलेस्ट्रॉल (LDL) और ट्राइग्लिसराइड्स (चर्बी) को तेजी से घटाता है',
      'दिल की नसों में ब्लॉकेज बनने से रोकता है और हार्ट अटैक के खतरे को टालता है',
    ],
    sideEffects_en: {
      common: ['Muscle ache, joint pain, mild diarrhea or indigestion'],
      serious: ['Severe muscle breakdown (rhabdomyolysis - rare), elevated liver enzymes'],
    },
    sideEffects_hi: {
      common: ['मांसपेशियों में हल्का दर्द, जोड़ों का दर्द, अपच'],
      serious: ['मांसपेशियों का गंभीर खिंचाव व कमजोरी (दुर्लभ)'],
    },
    howToUse_en: 'Take ONCE daily in the EVENING or at NIGHT with water (cholesterol synthesis peaks at night).',
    howToUse_hi: 'रोजाना रात को भोजन के बाद 1 गोली लें (शरीर में कोलेस्ट्रॉल रात को ही ज्यादा बनता है)।',
    precautions_en: ['Avoid drinking large amounts of grapefruit juice. Report unexplained muscle soreness.'],
    precautions_hi: ['अंगूर या मौसमी का जूस ज्यादा न पिएं। बिना वजह मांसपेशियों में दर्द हो तो डॉक्टर को बताएं।'],
    safetyAdvice: {
      pregnancy: { text_en: 'STRICTLY CONTRAINDICATED in pregnancy', text_hi: 'गर्भावस्था में सख्त मना', status: 'unsafe' },
      alcohol: { text_en: 'Avoid: Combined liver burden', text_hi: 'बचें: लिवर पर अतिरिक्त दबाव', status: 'caution' },
      driving: { text_en: 'Safe', text_hi: 'सुरक्षित', status: 'safe' },
      kidneyLiver: { text_en: 'Monitor liver enzymes periodically', text_hi: 'लिवर की जांच कराते रहें', status: 'caution' },
    },
    keywords: ['atorvastatin', 'atorva', 'storvas', 'cholesterol', 'heart', 'lipitor', 'rosuvastatin', 'bad cholesterol', 'charbi'],
  },

  {
    id: 'glycomet-500',
    name: 'Glycomet 500 / Metformin',
    brandNames: ['Glycomet 500', 'Glucophage', 'Obimet', 'Cetapin', 'Metformin'],
    hindiNames: ['ग्लाइकोमेट', 'मेटफॉर्मिन', 'शुगर की दवा', 'डायबिटीज', 'मधुमेह'],
    salt: 'Metformin Hydrochloride (500mg / 850mg / 1000mg)',
    category_en: 'Biguanide Antidiabetic (Type 2 Diabetes)',
    category_hi: 'एंटीडायबिटिक दवा (टाइप-2 शुगर / मधुमेह की दवा)',
    tag: 'Diabetes',
    uses_en: [
      'Controls high blood sugar levels in Type 2 Diabetes Mellitus',
      'Improves body sensitivity to insulin and reduces liver glucose production',
      'Widely used in managing Polycystic Ovary Syndrome (PCOS) in women',
    ],
    uses_hi: [
      'टाइप-2 डायबिटीज (शुगर) के मरीजों में ब्लड शुगर को नियंत्रित रखता है',
      'शरीर में इंसुलिन के प्रति संवेदनशीलता बढ़ाता है और लिवर में अतिरिक्त शुगर बनने से रोकता है',
      'महिलाओं में पीसीओएस (PCOS) और हार्मोनल असंतुलन को ठीक करने में भी उपयोग',
    ],
    sideEffects_en: {
      common: ['Nausea, flatulence, diarrhea, stomach ache, metallic taste'],
      serious: ['Lactic acidosis (very rare, mainly in severe kidney disease)'],
    },
    sideEffects_hi: {
      common: ['पेट में गैस, मतली, हल्के दस्त, पेट दर्द, मुंह में कड़वाहट'],
      serious: ['लैक्टिक एसिडोसिस (अत्यंत दुर्लभ, केवल गंभीर किडनी खराबी में)'],
    },
    howToUse_en: 'Take WITH or IMMEDIATELY AFTER meals to minimize stomach upset. Swallow whole with water.',
    howToUse_hi: 'हमेशा भोजन के साथ या भोजन के तुरंत बाद लें ताकि पेट में गैस या खराबी न हो।',
    precautions_en: [
      'Do not consume alcohol: increases the risk of lactic acidosis.',
      'Check Vitamin B12 levels periodically with long-term use.',
    ],
    precautions_hi: [
      'शराब का सेवन बिल्कुल न करें: इससे गंभीर एसिडोसिस का खतरा बढ़ता है।',
      'सालों तक लेने पर समय-समय पर विटामिन B12 की जांच कराते रहें।',
    ],
    safetyAdvice: {
      pregnancy: { text_en: 'Frequently used for gestational diabetes under strict supervision', text_hi: 'डॉक्टर की कड़ी निगरानी में इस्तेमाल किया जाता है', status: 'safe' },
      alcohol: { text_en: 'STRICTLY UNSAFE: Risk of dangerous lactic acidosis', text_hi: 'सख्त असुरक्षित: खतरनाक साइड इफेक्ट्स का खतरा', status: 'unsafe' },
      driving: { text_en: 'Safe alone; does not cause hypoglycemia unless taken with other diabetes drugs', text_hi: 'सुरक्षित; अकेले लेने पर शुगर अचानक नहीं गिरती', status: 'safe' },
      kidneyLiver: { text_en: 'Contraindicated in severe renal failure', text_hi: 'गंभीर किडनी रोग में मना है', status: 'unsafe' },
    },
    keywords: ['glycomet', 'metformin', 'sugar', 'diabetes', 'madhumeh', 'blood sugar', 'pcos', 'glucophage'],
  },

  // ==================== 6. VITAMINS & WELLNESS (विटामिन्स व सप्लीमेंट्स) ====================
  {
    id: 'becosules',
    name: 'Becosules / Vitamin B-Complex',
    brandNames: ['Becosules', 'Neurobion Forte', 'Cobadex Forte', 'B-Complex'],
    hindiNames: ['बिकासूल्स', 'न्यूरोबियन', 'मुंह के छाले', 'कमजोरी', 'विटामिन बी'],
    salt: 'Vitamin B-Complex (B1, B2, B3, B6, B12, Folic Acid) + Vitamin C',
    category_en: 'Multivitamin (Nerve Health & Mouth Ulcers)',
    category_hi: 'मल्टीविटामिन (मुंह के छाले, नसें व कमजोरी)',
    tag: 'Vitamins & Wellness',
    uses_en: [
      'Heals painful mouth ulcers, tongue sores, and cracked lips (angular cheilitis)',
      'Recharges energy, fights general weakness, fatigue, and lethargy',
      'Strengthens nerve function and prevents tingling/numbness in limbs',
    ],
    uses_hi: [
      'मुंह के छालों, जीभ के कटने-छिलने और होठों के कोनों के फटने को तेजी से ठीक करता है',
      'शरीर की कमजोरी, थकान, सुस्ती दूर करके नई ऊर्जा भरता है',
      'हाथ-पैरों में झनझनाहट, सुन्नपन और नसों की कमजोरी में अत्यंत गुणकारी',
    ],
    sideEffects_en: {
      common: ['Bright yellow coloration of urine (harmless due to riboflavin / Vit B2)'],
      serious: ['Mild stomach upset if taken empty stomach'],
    },
    sideEffects_hi: {
      common: ['पेशाब का रंग चटक पीला होना (यह विटामिन B2 की वजह से बिल्कुल सामान्य और हानिरहित है)'],
      serious: ['खाली पेट लेने पर पेट में हल्की बेचैनी'],
    },
    howToUse_en: 'Take ONE capsule daily after breakfast or lunch with a glass of water.',
    howToUse_hi: 'रोजाना सुबह नाश्ते या दोपहर के खाने के बाद 1 कैप्सूल पानी से लें।',
    precautions_en: ['Urine turning bright yellow is completely normal and harmless.'],
    precautions_hi: ['पेशाब का पीला होना स्वाभाविक है, घबराने की कोई बात नहीं है।'],
    safetyAdvice: {
      pregnancy: { text_en: 'Safe and beneficial under normal dietary doses', text_hi: 'सामान्य खुराक में पूरी तरह सुरक्षित और फायदेमंद', status: 'safe' },
      alcohol: { text_en: 'Safe', text_hi: 'सुरक्षित', status: 'safe' },
      driving: { text_en: 'Safe', text_hi: 'सुरक्षित', status: 'safe' },
      kidneyLiver: { text_en: 'Safe in standard doses', text_hi: 'सुरक्षित', status: 'safe' },
    },
    keywords: ['becosules', 'neurobion', 'vitamin b', 'mouth ulcer', 'muh ke chhale', 'chhale', 'kamzori', 'weakness', 'nerves'],
  },

  {
    id: 'shelcal-500',
    name: 'Shelcal 500 / Calcium + D3',
    brandNames: ['Shelcal 500', 'Cipcal 500', 'Gemcal', 'Calcimax', 'Calcium'],
    hindiNames: ['शैलकल', 'सिपकल', 'कैल्शियम', 'हड्डी दर्द', 'विटामिन डी'],
    salt: 'Calcium (500mg) + Vitamin D3 (250 IU)',
    category_en: 'Mineral & Vitamin Supplement (Bone & Joint Health)',
    category_hi: 'कैल्शियम व विटामिन D3 सप्लीमेंट (हड्डियों व जोड़ों की मजबूती)',
    tag: 'Vitamins & Wellness',
    uses_en: [
      'Strengthens weak bones, prevents osteoporosis and fractures',
      'Relieves knee pain, joint stiffness, and age-related bone density loss',
      'Essential for pregnant and nursing mothers to support baby bone development',
    ],
    uses_hi: [
      'कमजोर हड्डियों को मजबूत करता है, ऑस्टियोपोरोसिस (हड्डी घिसने) से बचाता है',
      'घुटनों के दर्द, जोड़ों की कट-कट आवाज और कमर दर्द में राहत देता है',
      'गर्भवती और स्तनपान कराने वाली माताओं के लिए कैल्शियम की पूर्ति करता है',
    ],
    sideEffects_en: {
      common: ['Constipation, mild gas, stomach bloating'],
      serious: ['Kidney stones with prolonged unmonitored overdose'],
    },
    sideEffects_hi: {
      common: ['कब्ज (Constipation), पेट में हल्की गैस या भारीपन'],
      serious: ['सालों तक बिना जांच कराए बहुत ज्यादा लेने पर गुर्दे की पथरी'],
    },
    howToUse_en: 'Take ONE tablet once daily after your main meal (lunch or dinner) with a full glass of water.',
    howToUse_hi: 'रोजाना दोपहर या रात के खाने के बाद 1 गोली पूरे गिलास पानी के साथ लें।',
    precautions_en: ['Drink plenty of water. Keep 4 hours gap from thyroid medicine.'],
    precautions_hi: ['खूब पानी पिएं। थायराइड की दवा से 4 घंटे का अंतर रखें।'],
    safetyAdvice: {
      pregnancy: { text_en: 'Safe and recommended in 2nd and 3rd trimesters', text_hi: 'गर्भावस्था में अत्यंत अनुशंसित व सुरक्षित', status: 'safe' },
      alcohol: { text_en: 'Safe', text_hi: 'सुरक्षित', status: 'safe' },
      driving: { text_en: 'Safe', text_hi: 'सुरक्षित', status: 'safe' },
      kidneyLiver: { text_en: 'Caution if you have kidney stones', text_hi: 'पथरी के मरीज डॉक्टर से पूछकर लें', status: 'caution' },
    },
    keywords: ['shelcal', 'cipcal', 'calcium', 'vitamin d3', 'haddi', 'bone pain', 'knee pain', 'joints', 'osteoporosis'],
  },

  {
    id: 'limcee',
    name: 'Limcee / Celin 500 (Vitamin C)',
    brandNames: ['Limcee 500', 'Celin 500', 'Sukcee', 'Ascorbic Acid'],
    hindiNames: ['लिम्सी', 'सेलिन', 'विटामिन सी', 'इम्यूनिटी', 'त्वचा'],
    salt: 'Vitamin C / Ascorbic Acid (500mg)',
    category_en: 'Antioxidant & Immunity Booster',
    category_hi: 'विटामिन सी व रोग प्रतिरोधक क्षमता वर्धक',
    tag: 'Vitamins & Wellness',
    uses_en: [
      'Boosts immune system against recurring viral colds, coughs, and infections',
      'Aids wound healing and promotes glowing skin and collagen synthesis',
      'Enhances iron absorption from dietary food',
    ],
    uses_hi: [
      'बार-बार सर्दी-जुकाम और इन्फेक्शन से लड़ने की इम्यूनिटी बढ़ाता है',
      'घाव जल्दी भरने, मसूड़ों की मजबूती और त्वचा में निखार लाने में सहायक',
      'भोजन से आयरन सोखने में मदद करता है',
    ],
    sideEffects_en: {
      common: ['Mild stomach acidity, diarrhea with very high doses (>2000mg)'],
      serious: ['Kidney stones with extreme prolonged overdose'],
    },
    sideEffects_hi: {
      common: ['पेट में हल्की खटास, बहुत ज्यादा खाने पर दस्त'],
      serious: ['अत्यधिक ओवरडोज पर पथरी का जोखिम'],
    },
    howToUse_en: 'Chew 1 tablet daily after food. Has pleasant orange flavor.',
    howToUse_hi: 'रोजाना खाने के बाद 1 गोली चबाकर खाएं (संतरे का स्वादिष्ट स्वाद)।',
    precautions_en: ['Do not swallow whole; chew thoroughly.'],
    precautions_hi: ['चबाकर खाएं, साबुत न निगलें।'],
    safetyAdvice: {
      pregnancy: { text_en: 'Safe', text_hi: 'सुरक्षित', status: 'safe' },
      alcohol: { text_en: 'Safe', text_hi: 'सुरक्षित', status: 'safe' },
      driving: { text_en: 'Safe', text_hi: 'सुरक्षित', status: 'safe' },
      kidneyLiver: { text_en: 'Safe', text_hi: 'सुरक्षित', status: 'safe' },
    },
    keywords: ['limcee', 'celin', 'vitamin c', 'immunity', 'scurvy', 'skin', 'cold immunity'],
  },

  {
    id: 'zincovit',
    name: 'Zincovit / Supradyn',
    brandNames: ['Zincovit', 'Supradyn Daily', 'Revital H', 'A to Z NS'],
    hindiNames: ['जिंकोविट', 'सुप्राडिन', 'रिवाइटल', 'मल्टीविटामिन', 'ताकत'],
    salt: 'Multivitamins + Multiminerals + Zinc + Grape Seed Extract',
    category_en: 'Complete Daily Health Supplement',
    category_hi: 'दैनिक मल्टीविटामिन व मिनरल पूरक',
    tag: 'Vitamins & Wellness',
    uses_en: [
      'Overcomes physical weakness, fatigue, loss of stamina, and nutritional deficiencies',
      'Speeds up recovery after illness, dengue, or surgery',
      'Improves appetite and energy levels',
    ],
    uses_hi: [
      'शारीरिक कमजोरी, थकान, सुस्ती और पोषण की कमी को दूर करता है',
      'बुखार, डेंगू या किसी बीमारी के बाद शरीर में आई कमजोरी को तेजी से भरता है',
      'भूख और कार्यक्षमता में सुधार करता है',
    ],
    sideEffects_en: {
      common: ['Mild nausea or metallic taste if taken empty stomach'],
      serious: ['None at recommended dose'],
    },
    sideEffects_hi: {
      common: ['खाली पेट लेने पर हल्की मतली'],
      serious: ['सही मात्रा में कोई गंभीर साइड इफेक्ट नहीं'],
    },
    howToUse_en: 'Take ONE tablet daily after lunch or breakfast with water.',
    howToUse_hi: 'रोजाना दोपहर या सुबह के भोजन के बाद 1 गोली पानी से लें।',
    precautions_en: ['Always take after eating.'],
    precautions_hi: ['हमेशा भोजन के बाद ही लें।'],
    safetyAdvice: {
      pregnancy: { text_en: 'Safe under medical advice', text_hi: 'डॉक्टर से पूछें', status: 'safe' },
      alcohol: { text_en: 'Safe', text_hi: 'सुरक्षित', status: 'safe' },
      driving: { text_en: 'Safe', text_hi: 'सुरक्षित', status: 'safe' },
      kidneyLiver: { text_en: 'Safe', text_hi: 'सुरक्षित', status: 'safe' },
    },
    keywords: ['zincovit', 'supradyn', 'revital', 'multivitamin', 'weakness', 'kamzori', 'stamina', 'energy', 'zinc'],
  },

  // ==================== 7. FIRST AID & ANTISEPTIC (प्राथमिक उपचार) ====================
  {
    id: 'betadine',
    name: 'Betadine Ointment / Solution',
    brandNames: ['Betadine', 'Cipladine', 'Wokadine', 'Povidone Iodine', 'Soframycin', 'Burnol'],
    hindiNames: ['बीटाडीन', 'सिपलाडीन', 'सोफ्रामाइसिन', 'बर्नोल', 'चोट का मलहम', 'घाव'],
    salt: 'Povidone Iodine (5% / 10%) / Framycetin',
    category_en: 'Topical Antiseptic & Microbicide (Wound Care)',
    category_hi: 'एंटीसेप्टिक मलहम (घाव, चोट व कटने पर लगाने की दवा)',
    tag: 'First Aid',
    uses_en: [
      'Prevents infection in cuts, scrapes, wounds, scratches, and minor burns',
      'Pre-operative and post-operative surgical wound dressing',
      'Kills bacteria, viruses, and fungi on skin contact',
    ],
    uses_hi: [
      'कटे, छिले, घाव, चोट और खरोंच पर इन्फेक्शन व मवाद बनने से रोकता है',
      'ऑपरेशन के टांकों और हल्की जली हुई त्वचा की ड्रेसिंग में सर्वोत्तम',
      'त्वचा पर लगाते ही हानिकारक बैक्टीरिया, वायरस और फंगस को खत्म करता है',
    ],
    sideEffects_en: {
      common: ['Mild local stinging sensation on open cut, brown skin staining (washes off)'],
      serious: ['Allergic dermatitis in people sensitive to iodine'],
    },
    sideEffects_hi: {
      common: ['खुले घाव पर हल्की जलन, त्वचा पर भूरा रंग लगना (जो पानी से धुल जाता है)'],
      serious: ['आयोडीन से एलर्जी वाले व्यक्तियों में दाने या खुजली'],
    },
    howToUse_en: 'FOR EXTERNAL USE ONLY. Clean the affected wound with water or saline, apply a thin layer of ointment, and cover with clean sterile bandage if necessary.',
    howToUse_hi: 'केवल बाहरी त्वचा पर लगाने के लिए। घाव को साफ पानी से धोकर सुखाएं, फिर पतली परत लगाएं और साफ पट्टी बांधें।',
    precautions_en: [
      'NEVER swallow or put inside eyes or deep animal bites.',
      'Persons with thyroid disorders should avoid large area application.',
    ],
    precautions_hi: [
      'इसे कभी मुंह में न डालें, न ही आंखों में लगाएं। कुत्ते या जानवर के काटने पर तुरंत डॉक्टर को दिखाएं।',
      'थायराइड के रोगी शरीर के बहुत बड़े हिस्से पर लंबे समय तक न लगाएं।',
    ],
    safetyAdvice: {
      pregnancy: { text_en: 'Safe for small cuts; avoid prolonged large-scale use', text_hi: 'छोटे घावों पर सुरक्षित', status: 'safe' },
      alcohol: { text_en: 'Safe (external application)', text_hi: 'सुरक्षित (बाहरी प्रयोग)', status: 'safe' },
      driving: { text_en: 'Safe', text_hi: 'सुरक्षित', status: 'safe' },
      kidneyLiver: { text_en: 'Safe for small wounds', text_hi: 'सुरक्षित', status: 'safe' },
    },
    keywords: ['betadine', 'cipladine', 'antiseptic', 'wound', 'chot', 'ghav', 'iodine', 'povidone', 'malham', 'soframycin', 'burnol'],
  },

  {
    id: 'volini',
    name: 'Volini / Moov Pain Gel',
    brandNames: ['Volini', 'Moov', 'Fast Relief', 'Omnigel', 'Relispray'],
    hindiNames: ['वोलिनी', 'मूव', 'फास्ट रिलीफ', 'दर्द का स्प्रे', 'मोच'],
    salt: 'Diclofenac Diethylamine + Methyl Salicylate + Menthol + Linseed Oil',
    category_en: 'Topical Analgesic (Muscle & Joint Pain Gel)',
    category_hi: 'दर्द निवारक जेल व स्प्रे (कमर दर्द, मोच व खिंचाव)',
    tag: 'First Aid',
    uses_en: [
      'Fast deep-penetrating relief from back pain, neck pain, joint stiffness, and sprains',
      'Menthol provides instant soothing cooling sensation followed by warm relief',
    ],
    uses_hi: [
      'कमर दर्द, गर्दन में अकड़न, जोड़ों के दर्द और मोच में त्वचा के भीतर जाकर तुरंत आराम',
      'लगाते ही ठंडक और फिर गर्माहट देकर नसों की जकड़न खोलता है',
    ],
    sideEffects_en: {
      common: ['Mild skin redness, tingling warmth, or itching at application site'],
      serious: ['Rare contact dermatitis'],
    },
    sideEffects_hi: {
      common: ['हल्की झनझनाहट, गर्माहट या लाली'],
      serious: ['एलर्जी के दाने'],
    },
    howToUse_en: 'Apply a small quantity gently onto the painful area 3-4 times daily. Do not massage vigorously.',
    howToUse_hi: 'दर्द वाली जगह पर हल्के हाथ से दिन में 3-4 बार लगाएं। जोर से मालिश न करें।',
    precautions_en: ['Do not apply on broken skin, open wounds, or near eyes. Wash hands after use.'],
    precautions_hi: ['कटी-छिली त्वचा या आंखों के पास न लगाएं। लगाने के बाद हाथ धो लें।'],
    safetyAdvice: {
      pregnancy: { text_en: 'Safe for localized small-area use', text_hi: 'सीमित जगह पर सुरक्षित', status: 'safe' },
      alcohol: { text_en: 'Safe', text_hi: 'सुरक्षित', status: 'safe' },
      driving: { text_en: 'Safe', text_hi: 'सुरक्षित', status: 'safe' },
      kidneyLiver: { text_en: 'Safe', text_hi: 'सुरक्षित', status: 'safe' },
    },
    keywords: ['volini', 'moov', 'fast relief', 'omnigel', 'pain gel', 'moch', 'kamar dard', 'sprain', 'pain spray'],
  },

  {
    id: 'liv-52',
    name: 'Liv.52 / Liver Tonic',
    brandNames: ['Liv.52', 'Liv.52 DS', 'Himalaya Liv 52', 'Udiliv'],
    hindiNames: ['लिव 52', 'लिवर टॉनिक', 'भूख बढ़ाने की दवा', 'पीलिया'],
    salt: 'Himsra (Capparis spinosa) + Kasani (Cichorium intybus) Ayurvedic Extracts',
    category_en: 'Hepatoprotective (Liver Health & Appetite)',
    category_hi: 'लिवर सुरक्षा व भूख वर्धक आयुर्वेदिक टॉनिक',
    tag: 'Vitamins & Wellness',
    uses_en: [
      'Protects liver from toxins, alcohol damage, and medication stress',
      'Improves poor appetite, digestion, and aids recovery from jaundice',
      'Supports healthy liver enzymes in fatty liver disease',
    ],
    uses_hi: [
      'लिवर को नुकसान, शराब और दवाओं के बुरे प्रभाव से बचाता है',
      'भूख में भारी सुधार करता है और पीलिया (Jaundice) के बाद लिवर ठीक करता है',
      'फैटी लिवर में लिवर एंजाइम को सामान्य करने में सहायक',
    ],
    sideEffects_en: {
      common: ['None reported at normal doses; 100% natural herbal formulation'],
      serious: ['None'],
    },
    sideEffects_hi: {
      common: ['सामान्य खुराक में कोई साइड इफेक्ट नहीं; पूर्णतः प्राकृतिक'],
      serious: ['कोई नहीं'],
    },
    howToUse_en: 'Take 1 to 2 tablets twice daily before meals with water.',
    howToUse_hi: 'भोजन से पहले 1 से 2 गोली दिन में दो बार पानी के साथ लें।',
    precautions_en: ['Maintain a balanced healthy diet; avoid heavy alcohol and oily food.'],
    precautions_hi: ['तले-भुने भोजन और शराब से परहेज रखें।'],
    safetyAdvice: {
      pregnancy: { text_en: 'Safe and commonly used', text_hi: 'सुरक्षित व व्यापक प्रयुक्त', status: 'safe' },
      alcohol: { text_en: 'Safe (Helps liver recovery from alcohol damage)', text_hi: 'लिवर को शराब के नुकसान से बचाता है', status: 'safe' },
      driving: { text_en: 'Safe', text_hi: 'सुरक्षित', status: 'safe' },
      kidneyLiver: { text_en: 'Safe for liver', text_hi: 'लिवर के लिए अत्यंत गुणकारी', status: 'safe' },
    },
    keywords: ['liv 52', 'liv52', 'liver', 'jaundice', 'peeliya', 'bhookh', 'fatty liver', 'appetite', 'tonic'],
  },
];

/**
 * Universal Search algorithm with Devanagari Hindi + English support,
 * partial word matching, symptom matching, and tokenization.
 */
export function searchMedicineOffline(query) {
  if (!query || typeof query !== 'string') return [];
  const raw = query.trim().toLowerCase();
  if (!raw) return [];

  // Remove English punctuation but keep alphanumeric and Hindi Unicode (\u0900-\u097F)
  const normalized = raw.replace(/[^\w\s\u0900-\u097F]/g, ' ').replace(/\s+/g, ' ').trim();
  const searchTokens = normalized.split(' ').filter(Boolean);

  const results = [];

  for (const med of MEDICINE_DATABASE) {
    let score = 0;

    const medName = med.name.toLowerCase();
    const medId = med.id.toLowerCase();
    const medSalt = (med.salt || '').toLowerCase();
    const brands = (med.brandNames || []).map((b) => b.toLowerCase());
    const hindis = (med.hindiNames || []).map((h) => h.toLowerCase());
    const keywords = (med.keywords || []).map((k) => k.toLowerCase());

    // 1. Direct match on full query
    if (medName.includes(normalized) || medId.includes(normalized)) {
      score += 120;
    }

    for (const b of brands) {
      if (b === normalized) score += 100;
      else if (b.includes(normalized)) score += 60;
    }

    for (const h of hindis) {
      if (h === normalized) score += 100;
      else if (h.includes(normalized)) score += 60;
    }

    if (medSalt.includes(normalized)) {
      score += 50;
    }

    // 2. Tokenized search (e.g. "dolo 650", "pet dard", "headache fever", "gas tablet")
    let tokenMatches = 0;
    for (const token of searchTokens) {
      if (token.length < 2) continue;

      let matchedThisToken = false;

      if (medName.includes(token) || medId.includes(token)) {
        score += 40;
        matchedThisToken = true;
      }
      for (const b of brands) {
        if (b.includes(token)) {
          score += 35;
          matchedThisToken = true;
          break;
        }
      }
      for (const h of hindis) {
        if (h.includes(token)) {
          score += 35;
          matchedThisToken = true;
          break;
        }
      }
      if (medSalt.includes(token)) {
        score += 30;
        matchedThisToken = true;
      }
      for (const kw of keywords) {
        if (kw.includes(token)) {
          score += 25;
          matchedThisToken = true;
          break;
        }
      }

      if (matchedThisToken) tokenMatches++;
    }

    if (tokenMatches === searchTokens.length && searchTokens.length > 1) {
      score += 50; // Bonus for matching all search tokens
    }

    if (score > 0) {
      results.push({ ...med, matchScore: score });
    }
  }

  // Sort descending by relevance score
  return results.sort((a, b) => b.matchScore - a.matchScore);
}
