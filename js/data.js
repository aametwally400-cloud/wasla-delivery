// Static catalogue: restaurants, menus, option groups, riders, areas.
// Restaurant and rider names are fictional. Food photos are hot-linked from Unsplash.

export const img = (id, w = 800) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=70`;

const IMG = {
  burger1: '1568901346375-23c9450c58cd',
  burger2: '1550547660-d9450f859349',
  burger3: '1571091718767-18b5b1457add',
  burger4: '1561758033-d89a9ad46330',
  fries: '1573080496219-bb080dd4f877',
  shake: '1572490122747-3968b75cc699',
  pizza1: '1513104890138-7c749659a591',
  pizza2: '1565299624946-b28f40a0ae38',
  pizza3: '1574071318508-1cdbab80d002',
  pizza4: '1593560708920-61dd98c46a4e',
  pizza5: '1628840042765-356cda07504e',
  egypt1: '1547592180-85f173990554',
  egypt2: '1512058564366-18510be2db19',
  egypt3: '1565557623262-b51c2513a641',
  egypt4: '1585937421612-70a008356fbe',
  wrap1: '1529006557810-274b9b2fc783',
  wrap2: '1561651823-34feb02250e4',
  wrap3: '1626700051175-6818013e1d4f',
  grill1: '1555939594-58d7cb561ad1',
  grill2: '1544025162-d76694265947',
  grill3: '1600891964092-4316c288032e',
  grill4: '1432139555190-58524dae6a55',
  sushi1: '1579584425555-c3ce17fd4351',
  sushi2: '1553621042-f6e147245754',
  sushi3: '1617196034796-73dfa7b1fd56',
  ramen: '1569718212165-3a8278d5f624',
  healthy1: '1512621776951-a57141f2eefd',
  healthy2: '1546069901-ba9599a7e63c',
  healthy3: '1490645935967-10de6ba17061',
  healthy4: '1540189549336-e6e99c3679fe',
  toast: '1482049016688-2d3e1b311543',
  dessert1: '1578985545062-69928b1d9587',
  dessert2: '1551024601-bec78aea704b',
  dessert3: '1563805042-7684c019e1cb',
  dessert4: '1488477181946-6428a0291777',
  dessert5: '1565958011703-44f9829ba187',
  coffee1: '1495474472287-4d71bcdd2085',
  coffee2: '1509042239860-f550ce710b93',
  coffee3: '1461023058943-07fcbe16d735',
  croissant: '1555507036-ab1f4038808a',
  breakfast1: '1525351484163-7529414344d8',
  breakfast2: '1533089860892-a7c6f0a88666',
  breakfast3: '1484723091739-30a097e8f929',
  chicken1: '1626082927389-6cd097cdc6ec',
  chicken2: '1562967914-608f82629710',
  chicken3: '1598515214211-89d3c73ae83b',
  pasta1: '1563379926898-05f4575a45d8',
  pasta2: '1621996346565-e3dbc646d9a9',
  pasta3: '1473093295043-cdd812d0e601',
  pasta4: '1551183053-bf91a1d81141',
  spread: '1504674900247-0877df9cc836',
};
export const photo = (key, w) => img(IMG[key] || IMG.spread, w);

// ---------- Option groups (shared by many dishes) ----------
const c = (id, ar, en, price = 0) => ({ id, name: { ar, en }, price });
export const OPTION_GROUPS = {
  burgerSize: { name: { ar: 'الحجم', en: 'Size' }, required: true, max: 1, choices: [c('single', 'سينجل', 'Single'), c('double', 'دبل', 'Double', 85)] },
  burgerExtras: {
    name: { ar: 'إضافات', en: 'Extras' }, required: false, max: 3,
    choices: [c('cheese', 'شريحة تشيدر زيادة', 'Extra cheddar', 25), c('jalapeno', 'هالبينو', 'Jalapeños', 15), c('onion', 'بصل مكرمل', 'Caramelized onions', 20), c('bacon', 'بيف بيكون', 'Beef bacon', 45)],
  },
  pizzaSize: { name: { ar: 'الحجم', en: 'Size' }, required: true, max: 1, choices: [c('s', 'صغير', 'Small'), c('m', 'وسط', 'Medium', 60), c('l', 'كبير', 'Large', 120)] },
  pizzaCrust: { name: { ar: 'العجينة', en: 'Crust' }, required: true, max: 1, choices: [c('classic', 'كلاسيك', 'Classic'), c('thin', 'رفيعة', 'Thin'), c('stuffed', 'أطراف محشية جبنة', 'Cheese-stuffed edges', 55)] },
  kosharySize: { name: { ar: 'الحجم', en: 'Size' }, required: true, max: 1, choices: [c('s', 'صغير', 'Small'), c('m', 'وسط', 'Medium', 20), c('l', 'كبير', 'Large', 40), c('family', 'عائلي', 'Family', 110)] },
  kosharyExtras: { name: { ar: 'زوّد', en: 'Add more' }, required: false, max: 3, choices: [c('onion', 'بصل مقرمش زيادة', 'Extra crispy onions', 10), c('daqqa', 'دقة زيادة', 'Extra garlic vinegar', 5), c('shatta', 'شطة زيادة', 'Extra chili sauce', 5)] },
  spice: { name: { ar: 'درجة الحرارة', en: 'Spice level' }, required: true, max: 1, choices: [c('mild', 'عادي', 'Mild'), c('hot', 'سبايسي', 'Spicy'), c('fire', 'نار 🔥', 'On fire 🔥')] },
  dips: { name: { ar: 'صوصات', en: 'Dips' }, required: false, max: 3, choices: [c('toum', 'ثومية', 'Garlic toum', 15), c('ranch', 'رانش', 'Ranch', 15), c('bbq', 'باربكيو', 'BBQ', 15)] },
  coffeeSize: { name: { ar: 'الحجم', en: 'Size' }, required: true, max: 1, choices: [c('s', 'صغير', 'Small'), c('m', 'وسط', 'Medium', 15), c('l', 'كبير', 'Large', 30)] },
  milk: { name: { ar: 'نوع اللبن', en: 'Milk' }, required: true, max: 1, choices: [c('full', 'كامل الدسم', 'Whole'), c('skim', 'خالي الدسم', 'Skimmed'), c('oat', 'لبن شوفان', 'Oat', 30), c('almond', 'لبن لوز', 'Almond', 30)] },
  grillSide: { name: { ar: 'الطبق الجانبي', en: 'Side' }, required: true, max: 1, choices: [c('rice', 'رز بالشعرية', 'Vermicelli rice'), c('fries', 'بطاطس', 'Fries'), c('salad', 'سلطة خضرا', 'Green salad')] },
  sweetAddons: { name: { ar: 'إضافات', en: 'Add-ons' }, required: false, max: 2, choices: [c('icecream', 'بولة آيس كريم', 'Scoop of ice cream', 30), c('nuts', 'مكسرات زيادة', 'Extra nuts', 25)] },
};

// ---------- Restaurants & menus ----------
const it = (id, ar, en, price, img, extra = {}) => ({ id, name: { ar, en }, price, img, ...extra });
const d = (ar, en) => ({ ar, en });
const cat = (id, ar, en, items) => ({ id, name: { ar, en }, items });

export const RESTAURANTS = [
  {
    id: 'smash-lab', name: d('سماش لاب', 'Smash Lab'), cuisine: 'burgers', tags: ['burgers'],
    sub: d('برجر سماش · أمريكي', 'Smash burgers · American'), area: 'zamalek',
    rating: 4.8, reviews: 3120, eta: [20, 30], fee: 0, minOrder: 150, color: '#1f2937', cover: 'burger1',
    offer: d('توصيل مجاني', 'Free delivery'), weight: 15,
    menu: [
      cat('burgers', 'البرجر', 'Burgers', [
        it('sl-1', 'سماش كلاسيك', 'Classic Smash', 245, 'burger2', { desc: d('قطعتين لحم مضغوطين، تشيدر سايح، صوص البيت ومخلل.', 'Two smashed patties, melted cheddar, house sauce and pickles.'), popular: true, options: ['burgerSize', 'burgerExtras'] }),
        it('sl-2', 'ترافل مشروم', 'Truffle Mushroom', 295, 'burger4', { desc: d('مشروم سوتيه، مايونيز ترافل وجبنة سويسري.', 'Sautéed mushrooms, truffle mayo and Swiss cheese.'), popular: true, options: ['burgerSize', 'burgerExtras'] }),
        it('sl-3', 'هوت هني تشيكن', 'Hot Honey Chicken', 230, 'burger3', { desc: d('صدور فراخ كرسبي، عسل حار وكول سلو.', 'Crispy chicken breast, hot honey and slaw.'), options: ['burgerExtras'] }),
        it('sl-4', 'سموكي باربكيو', 'Smoky BBQ', 275, 'burger1', { desc: d('بصل مكرمل، بيف بيكون وصوص باربكيو مدخّن.', 'Caramelized onions, beef bacon and smoky BBQ sauce.'), options: ['burgerSize', 'burgerExtras'] }),
      ]),
      cat('sides', 'جانبي', 'Sides', [
        it('sl-5', 'بطاطس لودد', 'Loaded Fries', 120, 'fries', { desc: d('بطاطس مقرمشة بصوص الجبنة وقطع اللحم.', 'Crispy fries with cheese sauce and beef bits.'), popular: true }),
        it('sl-6', 'أونيون رينجز', 'Onion Rings', 85, 'fries', { desc: d('حلقات بصل مقرمشة مع صوص رانش.', 'Crispy onion rings with ranch.') }),
      ]),
      cat('drinks', 'مشروبات', 'Drinks', [
        it('sl-7', 'ميلك شيك أوريو', 'Oreo Milkshake', 110, 'shake'),
        it('sl-8', 'مشروب غازي', 'Soft drink', 35, 'shake'),
      ]),
    ],
  },
  {
    id: 'forno-napoli', name: d('فورنو نابولي', 'Forno Napoli'), cuisine: 'pizza', tags: ['pizza'],
    sub: d('بيتزا نابوليتان · إيطالي', 'Neapolitan pizza · Italian'), area: 'maadi',
    rating: 4.7, reviews: 1890, eta: [30, 40], fee: 20, minOrder: 180, color: '#b91c1c', cover: 'pizza1',
    offer: d('خصم 15%', '15% off'), weight: 12,
    menu: [
      cat('pizza', 'البيتزا', 'Pizza', [
        it('fn-1', 'مارجريتا', 'Margherita', 210, 'pizza3', { desc: d('صلصة طماطم سان مارزانو، موتزاريلا فريش وريحان.', 'San Marzano tomato, fresh mozzarella and basil.'), popular: true, options: ['pizzaSize', 'pizzaCrust'] }),
        it('fn-2', 'بيبروني', 'Pepperoni', 265, 'pizza5', { desc: d('بيبروني بقري مقرمش على موتزاريلا.', 'Crispy beef pepperoni over mozzarella.'), popular: true, options: ['pizzaSize', 'pizzaCrust'] }),
        it('fn-3', 'فور تشيز', 'Four Cheese', 285, 'pizza2', { desc: d('موتزاريلا، جورجونزولا، بارميزان وريكوتا.', 'Mozzarella, gorgonzola, parmesan and ricotta.'), options: ['pizzaSize', 'pizzaCrust'] }),
        it('fn-4', 'تشيكن رانش', 'Chicken Ranch', 270, 'pizza4', { desc: d('فراخ مشوية، صوص رانش، فلفل وبصل.', 'Grilled chicken, ranch, peppers and onion.'), options: ['pizzaSize', 'pizzaCrust'] }),
        it('fn-5', 'خضار سوبريم', 'Veggie Supreme', 230, 'pizza1', { desc: d('مشروم، زيتون، فلفل ألوان وطماطم.', 'Mushrooms, olives, bell peppers and tomato.'), options: ['pizzaSize', 'pizzaCrust'] }),
      ]),
      cat('starters', 'مقبلات', 'Starters', [
        it('fn-6', 'عيش بالتوم', 'Garlic Bread', 75, 'pizza2', { desc: d('عيش فرن بزبدة التوم والبقدونس.', 'Wood-fired bread with garlic butter and parsley.') }),
        it('fn-7', 'سلطة بوراتا', 'Burrata Salad', 190, 'healthy4', { desc: d('بوراتا كريمي، طماطم شيري وبيستو.', 'Creamy burrata, cherry tomatoes and pesto.') }),
      ]),
      cat('desserts', 'حلو', 'Dessert', [it('fn-8', 'تيراميسو', 'Tiramisu', 120, 'dessert5')]),
    ],
  },
  {
    id: 'bait-koshary', name: d('بيت الكشري', 'Bait El Koshary'), cuisine: 'egyptian', tags: ['egyptian'],
    sub: d('كشري وأكل بيتي · مصري', 'Koshary & home cooking · Egyptian'), area: 'downtown',
    rating: 4.9, reviews: 5240, eta: [15, 25], fee: 10, minOrder: 60, color: '#92400e', cover: 'egypt4',
    offer: null, weight: 16,
    menu: [
      cat('koshary', 'الكشري', 'Koshary', [
        it('bk-1', 'كشري', 'Koshary', 65, 'egypt4', { desc: d('رز، مكرونة، عدس، حمص، صلصة ودقة، وبصل مقرمش.', 'Rice, pasta, lentils, chickpeas, tomato sauce, garlic vinegar and crispy onions.'), popular: true, options: ['kosharySize', 'kosharyExtras'] }),
        it('bk-2', 'كشري سبيشيال', 'Koshary Special', 85, 'egypt1', { desc: d('حمص وعدس مضاعف وبصل زيادة.', 'Double chickpeas and lentils, extra onions.'), options: ['kosharySize', 'kosharyExtras'] }),
      ]),
      cat('plates', 'أطباق بيتي', 'Home plates', [
        it('bk-3', 'ملوخية بالفراخ', 'Molokhia with chicken', 165, 'egypt2', { desc: d('ملوخية بالتقلية مع ربع فرخة ورز.', 'Molokhia with garlic, a quarter chicken and rice.'), popular: true }),
        it('bk-4', 'طبق محشي مشكّل', 'Mixed mahshi plate', 140, 'egypt3', { desc: d('كرنب، ورق عنب، كوسة وفلفل.', 'Cabbage, vine leaves, zucchini and peppers.') }),
        it('bk-5', 'حواوشي', 'Hawawshi', 95, 'wrap3', { desc: d('عيش بلدي محشي لحمة مفرومة متتبلة.', 'Baladi bread stuffed with spiced minced beef.') }),
        it('bk-6', 'فتة باللحمة', 'Fattah with beef', 220, 'egypt3', { desc: d('عيش محمّص، رز، صلصة خل وتوم، ولحمة.', 'Toasted bread, rice, garlic-vinegar sauce and beef.') }),
      ]),
      cat('sweets', 'حلو', 'Sweets', [
        it('bk-7', 'رز بلبن', 'Rice pudding', 45, 'dessert4'),
        it('bk-8', 'أم علي', 'Om Ali', 60, 'dessert1'),
      ]),
    ],
  },
  {
    id: 'shawarma-station', name: d('محطة الشاورما', 'Shawarma Station'), cuisine: 'shawarma', tags: ['shawarma'],
    sub: d('شاورما سوري · ساندوتشات', 'Syrian shawarma · Wraps'), area: 'nasr',
    rating: 4.6, reviews: 2410, eta: [20, 30], fee: 15, minOrder: 100, color: '#b45309', cover: 'wrap1',
    offer: d('اشتري 2 والتالت هدية', 'Buy 2, get 1 free'), weight: 13,
    menu: [
      cat('sandwiches', 'ساندوتشات', 'Sandwiches', [
        it('ss-1', 'شاورما فراخ', 'Chicken shawarma', 95, 'wrap3', { desc: d('فراخ متبّلة، ثومية، مخلل وبطاطس.', 'Marinated chicken, toum, pickles and fries.'), popular: true, options: ['spice', 'dips'] }),
        it('ss-2', 'شاورما لحمة', 'Beef shawarma', 125, 'wrap3', { desc: d('لحمة بقري، طحينة، بصل وطماطم.', 'Beef, tahini, onion and tomato.'), options: ['spice', 'dips'] }),
      ]),
      cat('meals', 'وجبات', 'Meals', [
        it('ss-3', 'فتة شاورما فراخ', 'Chicken shawarma fatteh', 175, 'wrap1', { desc: d('رز، عيش محمّص، شاورما وصوص ثومية.', 'Rice, toasted bread, shawarma and toum.'), popular: true, options: ['spice'] }),
        it('ss-4', 'وجبة عربي', 'Arabi meal', 165, 'wrap1', { desc: d('شاورما مقطّعة، بطاطس، ثومية ومخلل.', 'Sliced shawarma, fries, toum and pickles.'), options: ['spice', 'dips'] }),
      ]),
      cat('extras', 'إضافات', 'Extras', [
        it('ss-5', 'بطاطس', 'Fries', 45, 'fries'),
        it('ss-6', 'ليمون نعناع', 'Lemon mint', 50, 'coffee3'),
      ]),
    ],
  },
  {
    id: 'grill-house', name: d('جريل هاوس', 'Grill House'), cuisine: 'grills', tags: ['grills', 'egyptian'],
    sub: d('مشويات على الفحم · مصري', 'Charcoal grills · Egyptian'), area: 'mohandessin',
    rating: 4.7, reviews: 1560, eta: [35, 50], fee: 25, minOrder: 250, color: '#7f1d1d', cover: 'grill1',
    offer: null, weight: 9,
    menu: [
      cat('grills', 'المشويات', 'Grills', [
        it('gh-1', 'مشويات مشكّلة ½ كيلو', 'Mixed grill (½ kg)', 520, 'grill1', { desc: d('كفتة، طرب، شيش طاووق وريش.', 'Kofta, tarb, shish tawook and lamb chops.'), popular: true, options: ['grillSide'] }),
        it('gh-2', 'كفتة ربع كيلو', 'Kofta (¼ kg)', 230, 'grill4', { desc: d('كفتة بقري على الفحم بالبهارات البيتي.', 'Charcoal beef kofta with house spices.'), popular: true, options: ['grillSide'] }),
        it('gh-3', 'شيش طاووق', 'Shish tawook', 210, 'grill1', { options: ['grillSide'] }),
        it('gh-4', 'ريش ضاني', 'Lamb chops', 480, 'grill3', { options: ['grillSide'] }),
        it('gh-5', 'نص فرخة مشوية', 'Half grilled chicken', 195, 'chicken3', { options: ['grillSide'] }),
      ]),
      cat('salads', 'سلطات', 'Salads', [
        it('gh-6', 'طحينة', 'Tahini', 30, 'healthy4'),
        it('gh-7', 'بابا غنوج', 'Baba ghanoush', 45, 'healthy2'),
      ]),
    ],
  },
  {
    id: 'sakura-roll', name: d('ساكورا رول', 'Sakura Roll'), cuisine: 'sushi', tags: ['sushi'],
    sub: d('سوشي ورامن · ياباني', 'Sushi & ramen · Japanese'), area: 'newcairo',
    rating: 4.8, reviews: 980, eta: [35, 45], fee: 30, minOrder: 300, color: '#be123c', cover: 'sushi1',
    offer: d('جديد', 'New'), weight: 6,
    menu: [
      cat('rolls', 'رولز', 'Rolls', [
        it('sk-1', 'كريزي رول (8 قطع)', 'Crazy roll (8 pcs)', 290, 'sushi2', { desc: d('سلمون، كابوريا، أفوكادو وصوص سبايسي.', 'Salmon, crab, avocado and spicy mayo.'), popular: true }),
        it('sk-2', 'دراجون رول', 'Dragon roll', 340, 'sushi3', { desc: d('جمبري تمبورا مغطى بالأفوكادو والأوناجي.', 'Shrimp tempura topped with avocado and eel sauce.'), popular: true }),
        it('sk-3', 'كاليفورنيا رول', 'California roll', 240, 'sushi1'),
        it('sk-4', 'نيجيري سلمون (6)', 'Salmon nigiri (6)', 320, 'sushi1'),
      ]),
      cat('hot', 'أطباق سخنة', 'Hot dishes', [
        it('sk-5', 'رامن فراخ ترياكي', 'Teriyaki chicken ramen', 260, 'ramen', { desc: d('مرقة غنية، نودلز، بيضة ومشروم.', 'Rich broth, noodles, soft egg and mushrooms.') }),
        it('sk-6', 'إدامامي', 'Edamame', 110, 'healthy1'),
      ]),
    ],
  },
  {
    id: 'green-bowl', name: d('جرين بول', 'Green Bowl'), cuisine: 'healthy', tags: ['healthy', 'breakfast'],
    sub: d('بولز وسلطات · صحي', 'Bowls & salads · Healthy'), area: 'zayed',
    rating: 4.6, reviews: 870, eta: [25, 35], fee: 15, minOrder: 150, color: '#15803d', cover: 'healthy2',
    offer: null, weight: 7,
    menu: [
      cat('bowls', 'بولز', 'Bowls', [
        it('gb-1', 'بول كينوا وفراخ مشوية', 'Grilled chicken quinoa bowl', 225, 'healthy1', { desc: d('كينوا، فراخ، أفوكادو، حمص وصوص طحينة بالليمون.', 'Quinoa, chicken, avocado, chickpeas and lemon tahini.'), popular: true }),
        it('gb-2', 'بوكي سلمون', 'Salmon poke', 310, 'healthy2', { desc: d('سلمون، رز سوشي، مانجا وإدامامي.', 'Salmon, sushi rice, mango and edamame.') }),
        it('gb-3', 'سيزر سالاد', 'Caesar salad', 175, 'healthy4'),
      ]),
      cat('brunch', 'برانش', 'Brunch', [
        it('gb-4', 'توست أفوكادو', 'Avocado toast', 160, 'toast', { desc: d('عيش ساوردو، أفوكادو مهروس وبيضة بوشيه.', 'Sourdough, smashed avocado and a poached egg.'), popular: true }),
        it('gb-5', 'سموذي أخضر', 'Green smoothie', 95, 'shake'),
      ]),
    ],
  },
  {
    id: 'sweet-corner', name: d('ركن الحلويات', 'Sweet Corner'), cuisine: 'desserts', tags: ['desserts', 'egyptian'],
    sub: d('حلويات شرقي وغربي', 'Oriental & western desserts'), area: 'heliopolis',
    rating: 4.9, reviews: 3870, eta: [20, 30], fee: 10, minOrder: 80, color: '#a21caf', cover: 'dessert2',
    offer: d('من 75 ج.م', 'From EGP 75'), weight: 10,
    menu: [
      cat('oriental', 'شرقي', 'Oriental', [
        it('sc-1', 'كنافة بالقشطة', 'Kunafa with cream', 120, 'dessert3', { desc: d('كنافة مقرمشة محشية قشطة بلدي وشربات.', 'Crispy kunafa filled with clotted cream and syrup.'), popular: true, options: ['sweetAddons'] }),
        it('sc-2', 'بسبوسة بالمكسرات', 'Basbousa with nuts', 75, 'dessert5', { options: ['sweetAddons'] }),
        it('sc-3', 'أم علي بالمكسرات', 'Om Ali with nuts', 95, 'dessert4', { desc: d('رقائق عجين باللبن والمكسرات والزبيب، سخنة.', 'Warm pastry baked in milk with nuts and raisins.'), popular: true, options: ['sweetAddons'] }),
      ]),
      cat('western', 'غربي', 'Western', [
        it('sc-4', 'مولتن كيك', 'Molten chocolate cake', 140, 'dessert1', { options: ['sweetAddons'] }),
        it('sc-5', 'آيس كريم 3 بولات', 'Ice cream (3 scoops)', 90, 'dessert3'),
        it('sc-6', 'تشيز كيك مانجا', 'Mango cheesecake', 135, 'dessert5'),
      ]),
    ],
  },
  {
    id: 'bean-brew', name: d('بين آند برو', 'Bean & Brew'), cuisine: 'coffee', tags: ['coffee', 'breakfast'],
    sub: d('قهوة مختصّة ومخبوزات', 'Specialty coffee & bakery'), area: 'gardencity',
    rating: 4.7, reviews: 1420, eta: [15, 25], fee: 10, minOrder: 70, color: '#44403c', cover: 'coffee1',
    offer: null, weight: 9,
    menu: [
      cat('coffee', 'القهوة', 'Coffee', [
        it('bb-1', 'سبانش لاتيه', 'Spanish latte', 95, 'coffee3', { desc: d('إسبريسو مع لبن مكثّف محلّى.', 'Espresso with sweetened condensed milk.'), popular: true, options: ['coffeeSize', 'milk'] }),
        it('bb-2', 'آيس كراميل ماكياتو', 'Iced caramel macchiato', 110, 'coffee2', { popular: true, options: ['coffeeSize', 'milk'] }),
        it('bb-3', 'فلات وايت', 'Flat white', 85, 'coffee1', { options: ['milk'] }),
        it('bb-4', 'قهوة تركي', 'Turkish coffee', 45, 'coffee1'),
        it('bb-5', 'ماتشا لاتيه', 'Matcha latte', 120, 'coffee2', { options: ['coffeeSize', 'milk'] }),
      ]),
      cat('bakery', 'مخبوزات', 'Bakery', [
        it('bb-6', 'كرواسون زبدة', 'Butter croissant', 65, 'croissant'),
        it('bb-7', 'سينابون', 'Cinnamon roll', 85, 'croissant'),
      ]),
    ],
  },
  {
    id: 'taameya-time', name: d('تايم الطعمية', 'Taameya Time'), cuisine: 'breakfast', tags: ['breakfast', 'egyptian'],
    sub: d('فول وطعمية وفطار مصري', 'Ful, taameya & Egyptian breakfast'), area: 'dokki',
    rating: 4.8, reviews: 4610, eta: [15, 25], fee: 10, minOrder: 50, color: '#a16207', cover: 'breakfast2',
    offer: null, weight: 12,
    menu: [
      cat('sandwiches', 'ساندوتشات', 'Sandwiches', [
        it('tt-1', 'ساندوتش فول', 'Ful sandwich', 18, 'wrap3', { desc: d('فول بالزيت الحار والكمون في عيش بلدي.', 'Fava beans with spiced oil and cumin in baladi bread.'), popular: true }),
        it('tt-2', 'ساندوتش طعمية', 'Taameya sandwich', 18, 'wrap3', { desc: d('طعمية سخنة، طحينة وسلطة.', 'Hot taameya, tahini and salad.'), popular: true }),
      ]),
      cat('plates', 'أطباق', 'Plates', [
        it('tt-3', 'بوكس فطار مصري', 'Egyptian breakfast box', 140, 'breakfast1', { desc: d('فول، طعمية، بيض، بطاطس، سلطة وعيش.', 'Ful, taameya, eggs, fries, salad and bread.'), popular: true }),
        it('tt-4', 'شكشوكة', 'Shakshuka', 70, 'breakfast2'),
        it('tt-5', 'بيض بالبسطرمة', 'Eggs with pastrami', 85, 'breakfast1'),
        it('tt-6', 'فطير مشلتت بالعسل والقشطة', 'Feteer with honey & cream', 160, 'breakfast3'),
      ]),
      cat('drinks', 'مشروبات', 'Drinks', [it('tt-7', 'شاي بلبن', 'Tea with milk', 25, 'coffee1')]),
    ],
  },
  {
    id: 'crispy-chick', name: d('كرسبي تشيك', 'Crispy Chick'), cuisine: 'chicken', tags: ['chicken'],
    sub: d('فراخ مقرمشة · وجبات', 'Fried chicken · Meals'), area: 'maadi',
    rating: 4.5, reviews: 2980, eta: [20, 35], fee: 15, minOrder: 120, color: '#c2410c', cover: 'chicken1',
    offer: d('وجبة + مشروب هدية', 'Free drink with meals'), weight: 11,
    menu: [
      cat('meals', 'وجبات', 'Meals', [
        it('cc-1', 'وجبة كرسبي 3 قطع', 'Crispy meal (3 pcs)', 210, 'chicken1', { desc: d('3 قطع فراخ، بطاطس، كول سلو وعيش.', '3 pieces, fries, coleslaw and a bun.'), popular: true, options: ['spice', 'dips'] }),
        it('cc-2', 'سبايسي وينجز (8)', 'Spicy wings (8)', 190, 'chicken1', { options: ['dips'] }),
        it('cc-3', 'باكت ستربس 12 قطعة', 'Strips bucket (12)', 360, 'chicken2', { desc: d('12 قطعة ستربس و3 صوصات — للشلة.', '12 strips and 3 dips — for sharing.'), popular: true, options: ['spice', 'dips'] }),
        it('cc-4', 'ساندوتش كرانش', 'Crunch sandwich', 145, 'burger3', { options: ['spice'] }),
      ]),
      cat('sides', 'جانبي', 'Sides', [
        it('cc-5', 'كول سلو', 'Coleslaw', 35, 'healthy4'),
        it('cc-6', 'بطاطس بالبهارات', 'Seasoned fries', 50, 'fries'),
      ]),
    ],
  },
  {
    id: 'pasta-fresca', name: d('باستا فريسكا', 'Pasta Fresca'), cuisine: 'pasta', tags: ['pasta'],
    sub: d('باستا طازة · إيطالي', 'Fresh pasta · Italian'), area: 'heliopolis',
    rating: 4.6, reviews: 1130, eta: [30, 40], fee: 20, minOrder: 160, color: '#ca8a04', cover: 'pasta2',
    offer: null, weight: 8,
    menu: [
      cat('pasta', 'الباستا', 'Pasta', [
        it('pf-1', 'فيتوتشيني ألفريدو', 'Fettuccine Alfredo', 245, 'pasta3', { desc: d('صوص كريمة وبارميزان، فراخ ومشروم.', 'Cream and parmesan sauce, chicken and mushrooms.'), popular: true }),
        it('pf-2', 'بيني أرابياتا', 'Penne arrabbiata', 195, 'pasta1'),
        it('pf-3', 'سباجيتي بولونيز', 'Spaghetti bolognese', 235, 'pasta2', { desc: d('صلصة لحمة مطهية ببطء وبارميزان.', 'Slow-cooked beef ragù and parmesan.'), popular: true }),
        it('pf-4', 'باستا بيستو بالفراخ', 'Pesto chicken pasta', 255, 'pasta4'),
        it('pf-5', 'لينجويني سي فود', 'Seafood linguine', 345, 'pasta1'),
      ]),
      cat('more', 'كمان', 'More', [
        it('pf-6', 'موتزاريلا ستيكس', 'Mozzarella sticks', 110, 'pizza2'),
        it('pf-7', 'بانا كوتا', 'Panna cotta', 95, 'dessert4'),
      ]),
    ],
  },
];

export const CATEGORIES = [
  { id: 'burgers', img: 'burger1' },
  { id: 'pizza', img: 'pizza1' },
  { id: 'egyptian', img: 'egypt4' },
  { id: 'grills', img: 'grill1' },
  { id: 'shawarma', img: 'wrap1' },
  { id: 'chicken', img: 'chicken1' },
  { id: 'sushi', img: 'sushi2' },
  { id: 'pasta', img: 'pasta2' },
  { id: 'healthy', img: 'healthy1' },
  { id: 'breakfast', img: 'breakfast1' },
  { id: 'desserts', img: 'dessert2' },
  { id: 'coffee', img: 'coffee3' },
];

export const AREAS = {
  zamalek: d('الزمالك', 'Zamalek'),
  maadi: d('المعادي', 'Maadi'),
  heliopolis: d('مصر الجديدة', 'Heliopolis'),
  nasr: d('مدينة نصر', 'Nasr City'),
  dokki: d('الدقي', 'Dokki'),
  mohandessin: d('المهندسين', 'Mohandessin'),
  newcairo: d('التجمع الخامس', 'New Cairo'),
  zayed: d('الشيخ زايد', 'Sheikh Zayed'),
  gardencity: d('جاردن سيتي', 'Garden City'),
  downtown: d('وسط البلد', 'Downtown'),
};

export const RIDERS = [
  ['r1', 'محمود عادل', 'Mahmoud Adel', 'motorbike', 4.9],
  ['r2', 'كريم سمير', 'Karim Samir', 'motorbike', 4.8],
  ['r3', 'يوسف هاني', 'Youssef Hany', 'bicycle', 4.7],
  ['r4', 'عمر فتحي', 'Omar Fathy', 'motorbike', 4.9],
  ['r5', 'مصطفى علي', 'Mostafa Ali', 'car', 4.6],
  ['r6', 'أحمد رضا', 'Ahmed Reda', 'motorbike', 4.8],
  ['r7', 'حسن نبيل', 'Hassan Nabil', 'motorbike', 4.7],
  ['r8', 'إسلام طارق', 'Islam Tarek', 'bicycle', 4.9],
  ['r9', 'عمرو فوزي', 'Amr Fawzy', 'motorbike', 4.5],
  ['r10', 'شريف مجدي', 'Sherif Magdy', 'car', 4.8],
  ['r11', 'وليد سامي', 'Waleed Samy', 'motorbike', 4.7],
  ['r12', 'خالد إبراهيم', 'Khaled Ibrahim', 'motorbike', 4.6],
  ['r13', 'علي منصور', 'Ali Mansour', 'bicycle', 4.8],
  ['r14', 'رامي سعيد', 'Ramy Saeed', 'motorbike', 4.9],
].map(([id, ar, en, vehicle, rating]) => ({ id, name: { ar, en }, vehicle, rating }));

export const FIRST_NAMES = [
  ['أحمد', 'Ahmed'], ['محمد', 'Mohamed'], ['سارة', 'Sara'], ['نور', 'Nour'], ['مريم', 'Mariam'], ['يوسف', 'Youssef'],
  ['عمر', 'Omar'], ['ليلى', 'Laila'], ['هنا', 'Hana'], ['كريم', 'Karim'], ['فريدة', 'Farida'], ['مالك', 'Malek'],
  ['سلمى', 'Salma'], ['آدم', 'Adam'], ['جنى', 'Jana'], ['زياد', 'Ziad'], ['ياسمين', 'Yasmin'], ['حسن', 'Hassan'],
  ['رنا', 'Rana'], ['علي', 'Ali'], ['دينا', 'Dina'], ['مازن', 'Mazen'], ['منة', 'Menna'], ['طارق', 'Tarek'],
];
export const LAST_NAMES = [
  ['حسن', 'Hassan'], ['السيد', 'El-Sayed'], ['إبراهيم', 'Ibrahim'], ['مصطفى', 'Mostafa'], ['عبدالله', 'Abdallah'],
  ['فهمي', 'Fahmy'], ['شريف', 'Sherif'], ['نبيل', 'Nabil'], ['رشدي', 'Roshdy'], ['عادل', 'Adel'], ['سامي', 'Samy'],
  ['منصور', 'Mansour'], ['الشناوي', 'El-Shenawy'], ['زكي', 'Zaki'], ['الجمال', 'El-Gammal'],
];

export const PROMO_CODES = {
  WASLA20: { pct: 20, cap: 100 },
  SWEET10: { pct: 10, cap: 60 },
};

export const SERVICE_RATE = 0.05;
export const SERVICE_CAP = 25;

// ---------- Lookups ----------
export const restaurantById = Object.fromEntries(RESTAURANTS.map((r) => [r.id, r]));
export const itemById = {};
for (const r of RESTAURANTS) for (const cg of r.menu) for (const item of cg.items) itemById[item.id] = { ...item, restaurantId: r.id };
export const riderById = Object.fromEntries(RIDERS.map((r) => [r.id, r]));
