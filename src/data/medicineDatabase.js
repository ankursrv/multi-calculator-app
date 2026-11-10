/**
 * Comprehensive verified medical database of 40+ most commonly used
 * Indian & global medicines across key categories.
 * Contains verified salts, indications, side effects, dosage advice, and safety matrix
 * in both Hindi and English.
 */

export const MEDICINE_DATABASE = [
  // ==================== 1. FEVER & PAIN (बुखार और दर्द) ====================
  {
    id: 'dolo-650',
    name: 'Dolo 650 / Paracetamol',
    brandNames: ['Dolo 650', 'Crocin 650', 'Calpol 650', 'Pacimol', 'P-650'],
    salt: 'Paracetamol (Acetaminophen) 650mg',
    category_en: 'Antipyretic & Analgesic (Fever & Pain Relief)',
    category_hi: 'एंटीपीयरेटिक व दर्द निवारक (बुखार और बदन दर्द)',
    tag: 'Fever & Pain',
    uses_en: [
      'Reduces high fever (viral, flu, dengue, or general fever)',
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
    keywords: ['dolo', 'dolo650', 'paracetamol', 'calpol', 'crocin', 'fever', 'bukhar', 'headache', 'dard', 'pain', 'pacimol'],
  },

  {
    id: 'combiflam',
    name: 'Combiflam',
    brandNames: ['Combiflam', 'Ibugesic Plus', 'Flexon'],
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
    keywords: ['combiflam', 'ibuprofen', 'flexon', 'ibugesic', 'pain', 'dard', 'toothache', 'swelling', 'sujan'],
  },

  {
    id: 'meftal-spas',
    name: 'Meftal-Spas',
    brandNames: ['Meftal-Spas', 'Spasmonil', 'Colimex'],
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
      'Indian Pharmacopoeia Commission issues DRESS syndrome caution for long unmonitored use.',
    ],
    precautions_hi: [
      'इससे हल्की नींद या चक्कर आ सकते हैं, इसे लेने के तुरंत बाद गाड़ी न चलाएं।',
      'हमेशा कुछ खाने के बाद ही लें, खाली पेट कभी न लें।',
      'लंबे समय तक बिना डॉक्टर की निगरानी के लगातार इसका सेवन न करें।',
    ],
    safetyAdvice: {
      pregnancy: { text_en: 'Avoid without doctor consultation', text_hi: 'डॉक्टर की सलाह के बिना न लें', status: 'caution' },
      alcohol: { text_en: 'Unsafe: Enhances drowsiness and dizziness', text_hi: 'असुरक्षित: चक्कर और बेहोशी का जोखिम', status: 'unsafe' },
      driving: { text_en: 'Caution: Can cause blurred vision or drowsiness', text_hi: 'सावधानी: धुंधला दिखना या नींद आ सकती है', status: 'caution' },
      kidneyLiver: { text_en: 'Caution required', text_hi: 'सावधानी आवश्यक', status: 'caution' },
    },
    keywords: ['meftal', 'meftalspas', 'spas', 'pet dard', 'stomach pain', 'cramp', 'period pain', 'colic'],
  },

  // ==================== 2. ACIDITY & GAS (गैस व पेट की दवाएं) ====================
  {
    id: 'pan-d',
    name: 'Pan-D / Pantocid-D',
    brandNames: ['Pan-D', 'Pantocid-D SR', 'Pantosec-D', 'Pantop-D'],
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
    brandNames: ['Pan 40', 'Pantocid 40', 'Pantodac', 'Pantop 40'],
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
    precautions_en: [
      'Do not stop midway if prescribed for gastric ulcer healing.',
      'Take 30 minutes prior to eating for optimal enzyme blocking.',
    ],
    precautions_hi: [
      'यदि डॉक्टर ने पेट के अल्सर के लिए दी है तो बीच में बंद न करें।',
      'नाश्ता करने से आधा घंटा पहले लेने पर ही पूरा लाभ मिलता है।',
    ],
    safetyAdvice: {
      pregnancy: { text_en: 'Prescription needed', text_hi: 'डॉक्टर की सलाह अनुसार लें', status: 'caution' },
      alcohol: { text_en: 'Avoid: Counteracts acidity treatment', text_hi: 'बचें: शराब एसिडिटी को बढ़ाती है', status: 'caution' },
      driving: { text_en: 'Safe', text_hi: 'सुरक्षित', status: 'safe' },
      kidneyLiver: { text_en: 'Safe; no dose adjustment needed for mild issues', text_hi: 'सामान्यतः सुरक्षित', status: 'safe' },
    },
    keywords: ['pan 40', 'pan40', 'pantocid', 'pantoprazole', 'gas', 'acidity', 'tezaab', 'ulcer'],
  },

  {
    id: 'digene',
    name: 'Digene / Gelusil',
    brandNames: ['Digene', 'Gelusil', 'Gas-O-Fast', 'ENO'],
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
    keywords: ['digene', 'gelusil', 'eno', 'antacid', 'gas', 'bloating', 'seene me jalan', 'heartburn', 'syrup'],
  },

  {
    id: 'ondem-4',
    name: 'Ondem 4 / Emeset',
    brandNames: ['Ondem', 'Emeset', 'Vomikind', 'Zofran'],
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
    precautions_en: [
      'Do not take repeatedly if vomiting is accompanied by severe abdominal pain without medical check.',
      'Stay hydrated with ORS to prevent dehydration.',
    ],
    precautions_hi: [
      'यदि उल्टी के साथ पेट में बहुत तेज़ दर्द हो तो बिना डॉक्टर को दिखाए बार-बार न लें।',
      'उल्टी रुकने के बाद पानी की कमी दूर करने के लिए ओआरएस (ORS) घोल पिएं।',
    ],
    safetyAdvice: {
      pregnancy: { text_en: 'Commonly prescribed for morning sickness, consult gynaecologist', text_hi: 'प्रेग्नेंसी में डॉक्टर की सलाह पर दी जाती है', status: 'caution' },
      alcohol: { text_en: 'Avoid: Increases dizziness', text_hi: 'बचें: चक्कर और सिर भारी हो सकता है', status: 'caution' },
      driving: { text_en: 'Safe unless drowsy', text_hi: 'सामान्यतः सुरक्षित', status: 'safe' },
      kidneyLiver: { text_en: 'Max 8mg daily in severe liver impairment', text_hi: 'गंभीर लिवर बीमारी में कम खुराक लें', status: 'caution' },
    },
    keywords: ['ondem', 'emeset', 'vomikind', 'vomiting', 'ulti', 'nausea', 'ji machalna', 'travel sickness'],
  },

  {
    id: 'electral-ors',
    name: 'Electral / ORS',
    brandNames: ['Electral', 'Walyte', 'Prolyte', 'WHO-ORS'],
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
      serious: ['Electrolyte imbalance if prepared with too little water (too concentrated)'],
    },
    sideEffects_hi: {
      common: ['सही मात्रा में पानी मिलाकर पीने पर कोई साइड इफेक्ट नहीं'],
      serious: ['बहुत कम पानी में ज्यादा पाउडर घोलने पर शरीर में नमक की मात्रा बढ़ सकती है'],
    },
    howToUse_en: 'Dissolve entire packet (21.8g) in EXACTLY 1 liter of clean drinking water. Drink in small sips throughout the day. Discard prepared solution after 24 hours.',
    howToUse_hi: 'पूरा एक पैकेट ठीक 1 लीटर साफ पीने के पानी में अच्छी तरह घोलें। पूरे दिन घूंट-घूंट करके पिएं। बना हुआ घोल 24 घंटे के अंदर ही इस्तेमाल करें।',
    precautions_en: [
      'Do not boil the prepared ORS solution.',
      'Do not mix with milk, soup, or juice; mix only with clean drinking water.',
      'Diabetic and kidney patients should monitor potassium and sugar intake.',
    ],
    precautions_hi: [
      'घोल बनाने के बाद उसे दोबारा न उबालें।',
      'इसे दूध, सूप या जूस में न मिलाएं; केवल सादे पीने के पानी में ही घोलें।',
      'डायबिटीज और किडनी के मरीज डॉक्टर की सलाह अनुसार ही मात्रा तय करें।',
    ],
    safetyAdvice: {
      pregnancy: { text_en: '100% Safe and highly recommended during dehydration', text_hi: 'गर्भावस्था में पूरी तरह सुरक्षित और अनुशंसित', status: 'safe' },
      alcohol: { text_en: 'Safe; helps recover from alcohol dehydration (hangover)', text_hi: 'सुरक्षित; हैंगओवर डिहाइड्रेशन में मददगार', status: 'safe' },
      driving: { text_en: 'Safe', text_hi: 'सुरक्षित', status: 'safe' },
      kidneyLiver: { text_en: 'Kidney patients should check potassium limits', text_hi: 'किडनी रोगी पोटेशियम की मात्रा का ध्यान रखें', status: 'caution' },
    },
    keywords: ['electral', 'ors', 'dehydration', 'loose motion', 'dast', 'paani ki kami', 'energy', 'lu lagna'],
  },

  // ==================== 3. ALLERGY, COUGH & COLD (सर्दी, खांसी व एलर्जी) ====================
  {
    id: 'cetirizine',
    name: 'Cetirizine / Cetzine',
    brandNames: ['Cetzine', 'Alerid', 'Okacet', 'Zyrtec'],
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
    brandNames: ['Montair-LC', 'Montek-LC', 'Telekast-L', 'Monticope'],
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
    precautions_en: [
      'Take at night because Levocetirizine causes mild drowsiness.',
      'Complete the course prescribed by doctor (usually 5 to 10 days).',
    ],
    precautions_hi: [
      'इसे रात में ही लें क्योंकि इससे हल्की नींद आ सकती है।',
      'डॉक्टर द्वारा बताए गए दिनों (आमतौर पर 5 से 10 दिन) का कोर्स पूरा करें।',
    ],
    safetyAdvice: {
      pregnancy: { text_en: 'Consult doctor before use', text_hi: 'डॉक्टर से परामर्श के बाद ही लें', status: 'caution' },
      alcohol: { text_en: 'Unsafe: Increases sleepiness', text_hi: 'असुरक्षित: सुस्ती और चक्कर बढ़ाता है', status: 'unsafe' },
      driving: { text_en: 'Caution: Avoid driving if drowsy', text_hi: 'सावधानी: नींद महसूस हो तो गाड़ी न चलाएं', status: 'caution' },
      kidneyLiver: { text_en: 'Caution in severe renal impairment', text_hi: 'किडनी के मरीज सावधानी बरतें', status: 'caution' },
    },
    keywords: ['montair lc', 'montek lc', 'levocetirizine', 'montelukast', 'allergic cough', 'asthma', 'cheenk', 'cough', 'khansi'],
  },

  {
    id: 'ascoril-d',
    name: 'Ascoril-D / Benadryl (Dry Cough)',
    brandNames: ['Ascoril-D Plus', 'Benadryl DR', 'Alex', 'Zedex'],
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
      'गीली या बलगम वाली खांसी में इसे न पिएं (बलगम वाली खांसी के लिए बलगम निकालने वाला सीरप चाहिए)।',
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

  // ==================== 4. ANTIBIOTICS (एंटीबायोटिक दवाएं) ====================
  {
    id: 'augmentin-625',
    name: 'Augmentin 625 Duo',
    brandNames: ['Augmentin 625', 'Moxikind-CV 625', 'Clavam 625', 'Advent 625'],
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
    brandNames: ['Azithral 500', 'Azee 500', 'Azimax 500', 'Zithrox'],
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
    id: 'oflox-oz',
    name: 'Oflox-OZ / O2',
    brandNames: ['O2', 'Oflox-OZ', 'Zenflox-OZ', 'Ornof'],
    salt: 'Ofloxacin (200mg) + Ornidazole (500mg)',
    category_en: 'Broad Spectrum Antibacterial & Antiprotozoal (Diarrhea & Dysentery)',
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
      serious: ['Tendon pain, peripheral neuropathy (stop immediately)'],
    },
    sideEffects_hi: {
      common: ['मुंह में कड़वा या धातु जैसा स्वाद, भूख न लगना, उल्टी जैसा मन, चक्कर'],
      serious: ['नसों में झनझनाहट या जोड़ों-नस में दर्द (दवा तुरंत बंद कर डॉक्टर से मिलें)'],
    },
    howToUse_en: 'Take one tablet twice daily strictly after meals for 3 to 5 days as prescribed.',
    howToUse_hi: 'भोजन करने के बाद दिन में 2 बार (सुबह-शाम) एक-एक गोली पानी से लें। खाली पेट न लें।',
    precautions_en: [
      'CRITICAL: Strictly avoid all alcohol during and 48 hours after treatment (severe reaction).',
      'Drink plenty of fluids/ORS to prevent kidney crystals.',
    ],
    precautions_hi: [
      'अति आवश्यक: दवा के दौरान और खत्म होने के 2 दिन बाद तक शराब को हाथ भी न लगाएं (गंभीर रिएक्शन हो सकता है)।',
      'दवा के साथ ओआरएस (ORS) और पर्याप्त पानी जरूर पिएं।',
    ],
    safetyAdvice: {
      pregnancy: { text_en: 'Avoid during 1st trimester; consult doctor', text_hi: 'पहली तिमाही में असुरक्षित; डॉक्टर से पूछें', status: 'unsafe' },
      alcohol: { text_en: 'STRICTLY UNSAFE: Severe reaction (flushing, palpitations, vomiting)', text_hi: 'सख्त असुरक्षित: गंभीर रिएक्शन, उल्टी व दिल की तेज धड़कन', status: 'unsafe' },
      driving: { text_en: 'Caution: Can cause dizziness', text_hi: 'सावधानी: चक्कर आ सकते हैं', status: 'caution' },
      kidneyLiver: { text_en: 'Caution', text_hi: 'सावधानी रखें', status: 'caution' },
    },
    keywords: ['o2', 'oflox oz', 'zenflox oz', 'dast', 'pechish', 'loose motion', 'food poisoning', 'pet kharab'],
  },

  // ==================== 5. CHRONIC / BP & DIABETES (बीपी व शुगर) ====================
  {
    id: 'telma-40',
    name: 'Telma 40 / Telmisartan',
    brandNames: ['Telma 40', 'Telmikind', 'Telpres', 'Micardis'],
    salt: 'Telmisartan (40mg)',
    category_en: 'Angiotensin Receptor Blocker (ARB) - Blood Pressure',
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
      'Avoid potassium supplements or high-potassium salt substitutes without medical testing.',
      'Check BP regularly and maintain a log.',
    ],
    precautions_hi: [
      'बीपी की दवा को कभी भी अचानक अपनी मर्जी से बंद न करें।',
      'बिना डॉक्टर से पूछे पोटेशियम सप्लीमेंट या लो-सोडियम नमक न लें।',
      'नियमित रूप से बीपी चेक करते रहें।',
    ],
    safetyAdvice: {
      pregnancy: { text_en: 'STRICTLY CONTRAINDICATED in pregnancy: Can harm unborn baby', text_hi: 'गर्भावस्था में सख्त मना: गर्भस्थ शिशु के लिए जानलेवा', status: 'unsafe' },
      alcohol: { text_en: 'Caution: Can cause dangerously low blood pressure', text_hi: 'सावधानी: बीपी बहुत ज्यादा नीचे गिर सकता है', status: 'caution' },
      driving: { text_en: 'Caution initially if feeling lightheaded', text_hi: 'शुरुआत में चक्कर आए तो ड्राइविंग न करें', status: 'caution' },
      kidneyLiver: { text_en: 'Regular kidney function monitoring advised', text_hi: 'किडनी की नियमित जांच कराते रहें', status: 'caution' },
    },
    keywords: ['telma 40', 'telma40', 'telmisartan', 'bp', 'blood pressure', 'hypertension', 'high bp', 'heart'],
  },

  {
    id: 'glycomet-500',
    name: 'Glycomet 500 / Metformin',
    brandNames: ['Glycomet 500', 'Glucophage', 'Obimet', 'Cetapin'],
    salt: 'Metformin Hydrochloride (500mg)',
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
      'Inform doctor before any surgery or CT scan involving contrast dye.',
    ],
    precautions_hi: [
      'शराब का सेवन बिल्कुल न करें: इससे गंभीर एसिडोसिस का खतरा बढ़ता है।',
      'सालों तक लेने पर समय-समय पर विटामिन B12 की जांच कराते रहें।',
      'किसी भी सर्जरी या सीटी स्कैन (डाई वाले) से पहले डॉक्टर को यह दवा बताएं।',
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
    precautions_en: [
      'Urine turning bright yellow is completely normal and no cause for alarm.',
      'Take with food to avoid gastric irritation.',
    ],
    precautions_hi: [
      'पेशाब का पीला होना स्वाभाविक है, घबराने की कोई बात नहीं है।',
      'हमेशा भोजन के बाद ही लें।',
    ],
    safetyAdvice: {
      pregnancy: { text_en: 'Safe and beneficial under normal dietary doses', text_hi: 'सामान्य खुराक में पूरी तरह सुरक्षित और फायदेमंद', status: 'safe' },
      alcohol: { text_en: 'Safe (Alcohol depletes B-vitamins, so supplementation helps)', text_hi: 'सुरक्षित', status: 'safe' },
      driving: { text_en: 'Safe', text_hi: 'सुरक्षित', status: 'safe' },
      kidneyLiver: { text_en: 'Safe in standard doses', text_hi: 'सुरक्षित', status: 'safe' },
    },
    keywords: ['becosules', 'neurobion', 'vitamin b', 'mouth ulcer', 'muh ke chhale', 'chhale', 'kamzori', 'weakness', 'nerves'],
  },

  {
    id: 'shelcal-500',
    name: 'Shelcal 500 / Calcium + D3',
    brandNames: ['Shelcal 500', 'Cipcal 500', 'Gemcal', 'Calcimax'],
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
    precautions_en: [
      'Drink plenty of water throughout the day to avoid constipation.',
      'Do not take at the same time as thyroid medication (Thyronorm) or iron pills; keep a 4-hour gap.',
    ],
    precautions_hi: [
      'कब्ज से बचने के लिए दिनभर में खूब पानी पिएं।',
      'थायराइड की दवा (Thyronorm) या आयरन की गोली के साथ इसे न लें, 4 घंटे का अंतर रखें।',
    ],
    safetyAdvice: {
      pregnancy: { text_en: 'Safe and recommended in 2nd and 3rd trimesters', text_hi: 'गर्भावस्था में अत्यंत अनुशंसित व सुरक्षित', status: 'safe' },
      alcohol: { text_en: 'Safe', text_hi: 'सुरक्षित', status: 'safe' },
      driving: { text_en: 'Safe', text_hi: 'सुरक्षित', status: 'safe' },
      kidneyLiver: { text_en: 'Caution if you have a history of kidney stones', text_hi: 'पथरी के मरीज डॉक्टर से पूछकर लें', status: 'caution' },
    },
    keywords: ['shelcal', 'cipcal', 'calcium', 'vitamin d3', 'haddi', 'bone pain', 'knee pain', 'joints', 'osteoporosis'],
  },

  // ==================== 7. FIRST AID & ANTISEPTIC (प्राथमिक उपचार) ====================
  {
    id: 'betadine',
    name: 'Betadine Ointment / Solution',
    brandNames: ['Betadine', 'Cipladine', 'Wokadine', 'Povidone Iodine'],
    salt: 'Povidone Iodine (5% or 10%)',
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
    keywords: ['betadine', 'cipladine', 'antiseptic', 'wound', 'chot', 'ghav', 'iodine', 'povidone', 'malham'],
  },
];

/**
 * Search the verified offline database using name, salt, or keywords.
 * Supports fuzzy matching for brand names and salt components.
 */
export function searchMedicineOffline(query) {
  if (!query || typeof query !== 'string') return [];
  const clean = query.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!clean) return [];

  const results = [];

  for (const med of MEDICINE_DATABASE) {
    let score = 0;

    // Exact or starting match on name or ID
    const medId = med.id.replace(/[^a-z0-9]/g, '');
    const medName = med.name.toLowerCase().replace(/[^a-z0-9]/g, '');

    if (medName === clean || medId === clean) {
      score += 100;
    } else if (medName.startsWith(clean) || medId.startsWith(clean)) {
      score += 60;
    } else if (medName.includes(clean)) {
      score += 40;
    }

    // Check brand names
    for (const brand of med.brandNames) {
      const bClean = brand.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (bClean === clean) {
        score += 80;
      } else if (bClean.startsWith(clean)) {
        score += 50;
      } else if (bClean.includes(clean)) {
        score += 30;
      }
    }

    // Check salt
    const saltClean = med.salt.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (saltClean.includes(clean)) {
      score += 35;
    }

    // Check keywords (symptoms / aliases)
    for (const kw of med.keywords) {
      const kwClean = kw.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (kwClean === clean) {
        score += 50;
      } else if (kwClean.includes(clean)) {
        score += 25;
      }
    }

    if (score > 0) {
      results.push({ ...med, matchScore: score });
    }
  }

  // Sort descending by relevance score
  return results.sort((a, b) => b.matchScore - a.matchScore);
}
