const mongoose = require('mongoose');
const User = require('../models/User');
const Item = require('../models/Item');

const sampleUsers = [
  {
    username: 'julien_paris',
    email: 'julien@barterhub.eu',
    password: 'password123',
    bio: 'Architect, photographer & vintage Leica collector in Le Marais, Paris. Open to artistic exchanges, sales and gear rentals across Europe!',
    location: 'Paris, France 🇫🇷',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    rating: { average: 4.95, count: 22, total: 109 },
    completedTrades: 19
  },
  {
    username: 'elena_berlin',
    email: 'elena@barterhub.eu',
    password: 'password123',
    bio: 'Electronic music producer, vinyl archivist & analog synth enthusiast based in Kreuzberg, Berlin.',
    location: 'Berlin, Germany 🇩🇪',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    rating: { average: 5.0, count: 28, total: 140 },
    completedTrades: 25
  },
  {
    username: 'lars_amsterdam',
    email: 'lars@barterhub.eu',
    password: 'password123',
    bio: 'Industrial product designer, gravel cyclist and Scandinavian furniture craftsman in Amsterdam.',
    location: 'Amsterdam, Netherlands 🇳🇱',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    rating: { average: 4.88, count: 16, total: 78 },
    completedTrades: 13
  },
  {
    username: 'sofia_milano',
    email: 'sofia@barterhub.eu',
    password: 'password123',
    bio: 'Fashion curator, vintage watch collector and interior designer in Brera, Milan.',
    location: 'Milan, Italy 🇮🇹',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    rating: { average: 4.92, count: 31, total: 152 },
    completedTrades: 27
  },
  {
    username: 'mateo_bcn',
    email: 'mateo@barterhub.eu',
    password: 'password123',
    bio: 'Ceramic artist, espresso fanatic & vintage scooter enthusiast in Gràcia, Barcelona.',
    location: 'Barcelona, Spain 🇪🇸',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    rating: { average: 4.85, count: 14, total: 68 },
    completedTrades: 11
  },
  {
    username: 'demo_europa',
    email: 'demo@barterhub.eu',
    password: 'password123',
    bio: 'Official BarterHub Europa Demo Account. Explore verified European bartering, buying, and renting!',
    location: 'Vienna, Austria 🇦🇹',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    rating: { average: 4.98, count: 42, total: 209 },
    completedTrades: 38
  }
];

async function seedDatabase() {
  try {
    console.log('🇪🇺 Refreshing European database with 27 items across Barter, Sell, Rent...');
    
    // Clear and create users
    await User.deleteMany({});
    const createdUsers = [];
    for (const u of sampleUsers) {
      const newUser = new User(u);
      await newUser.save();
      createdUsers.push(newUser);
    }

    const [julien, elena, lars, sofia, mateo, demo] = createdUsers;

    await Item.deleteMany({});

    const sampleItems = [
      // ==========================================
      // ===== 🔄 BARTER ITEMS (TROCS) [1 to 9] ===
      // ==========================================
      {
        title: 'Sony Alpha a7 IV Full-Frame Camera + Zeiss 35mm f/1.4 GM',
        description: 'Flagship 33MP full-frame hybrid camera with 4K/60p video, 10-bit 4:2:2, and S-Cinetone. Sensor is in pristine condition. Includes genuine Sony FE 35mm f/1.4 GM lens, 3 original batteries, and European warranty papers.',
        category: 'Electronics',
        condition: 'Like New',
        estimatedValue: 2200,
        listingType: 'barter',
        images: [
          'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&auto=format&fit=crop&q=80'
        ],
        owner: julien._id,
        lookingFor: 'Vintage Leica M6 / M11 body or Moog Matriarch analog synthesizer',
        tags: ['sony', 'camera', 'photography', 'leica', 'paris'],
        location: 'Paris, France 🇫🇷'
      },
      {
        title: 'Vintage 1974 Höfner 500/1 "Violin" Bass Guitar (Made in Germany)',
        description: 'Authentic German-made semi-acoustic violin bass in rare 3-tone sunburst finish. Original German electronics, flatwound strings, warm vintage woody tone. Original velvet hard case included.',
        category: 'Music',
        condition: 'Good',
        estimatedValue: 1450,
        listingType: 'barter',
        images: [
          'https://images.unsplash.com/photo-1516924962500-2b4b3b99ea02?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1525201548942-d8732f6617a0?w=800&auto=format&fit=crop&q=80'
        ],
        owner: elena._id,
        lookingFor: 'Neumann U87 studio mic, Genelec 8341 monitors, or Roland Juno-60',
        tags: ['hofner', 'bass', 'vintage', 'music', 'berlin'],
        location: 'Berlin, Germany 🇩🇪'
      },
      {
        title: 'Canyon Endurace CF 7 All-Road Carbon Bike (Size M / 54cm)',
        description: 'Premium carbon endurance road bicycle engineered in Koblenz. Shimano 105 Di2 wireless 12-speed electronic shifting, hydraulic disc brakes, and DT Swiss tubeless wheelset.',
        category: 'Sports',
        condition: 'Like New',
        estimatedValue: 1850,
        listingType: 'barter',
        images: [
          'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?w=800&auto=format&fit=crop&q=80'
        ],
        owner: lars._id,
        lookingFor: 'High-end espresso machine (La Marzocco / Rocket) or Hasselblad 500CM',
        tags: ['canyon', 'bike', 'carbon', 'cycling', 'amsterdam'],
        location: 'Amsterdam, Netherlands 🇳🇱'
      },
      {
        title: 'Mid-Century Danish Teak Lowboard Credenza by Arne Hovmand-Olsen',
        description: 'Authentic 1960s Scandinavian modernist teak sideboard with sculptured solid handles and tambour sliding doors. Hand-restored with organic Danish beeswax polish. Museum grade condition.',
        category: 'Furniture',
        condition: 'Good',
        estimatedValue: 1600,
        listingType: 'barter',
        images: [
          'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=800&auto=format&fit=crop&q=80'
        ],
        owner: lars._id,
        lookingFor: 'Eames Lounge Chair & Ottoman or Swiss luxury mechanical timepiece',
        tags: ['danish', 'furniture', 'teak', 'scandinavian', 'design'],
        location: 'Amsterdam, Netherlands 🇳🇱'
      },
      {
        title: 'Moog Subsequent 37 Paraphonic Analog Synthesizer',
        description: 'Professional 37-key analog synth with dual oscillators, multidrive ladder filter, and 256 presets. Kept in smoke-free Berlin recording studio. Includes heavy-duty flight case.',
        category: 'Music',
        condition: 'Like New',
        estimatedValue: 1550,
        listingType: 'barter',
        images: [
          'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&auto=format&fit=crop&q=80'
        ],
        owner: elena._id,
        lookingFor: 'Elektron Octatrack MKII or high-end guitar amp (Fender Deluxe Reverb 65)',
        tags: ['moog', 'synth', 'music', 'analog', 'berlin'],
        location: 'Berlin, Germany 🇩🇪'
      },
      {
        title: 'Authentic Vintage Vespa 50 Special Piaggio (1979 Restored)',
        description: 'Fully restored 1979 Italian icon in Giallo Positano yellow. Original 4-speed manual gearbox, Dell\'Orto carburetor, rebuilt engine, and historic Italian registration plate.',
        category: 'Vehicles',
        condition: 'Good',
        estimatedValue: 2800,
        listingType: 'barter',
        images: [
          'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&auto=format&fit=crop&q=80'
        ],
        owner: mateo._id,
        lookingFor: 'Cargo e-Bike (Riese & Müller / Urban Arrow) or Cargo van',
        tags: ['vespa', 'scooter', 'vintage', 'italian', 'barcelona'],
        location: 'Barcelona, Spain 🇪🇸'
      },
      {
        title: 'Swiss Max Bill by Junghans Automatic Watch (Bauhaus Edition)',
        description: 'Pure German Bauhaus aesthetic with domed sapphire crystal, ETA 2824-2 automatic movement, and Milanese mesh steel bracelet. Box and warranty stamped in Zurich.',
        category: 'Jewelry',
        condition: 'Like New',
        estimatedValue: 980,
        listingType: 'barter',
        images: [
          'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&auto=format&fit=crop&q=80'
        ],
        owner: sofia._id,
        lookingFor: 'Nomos Glashütte Club Campus or iPad Pro 12.9" M2 with Pencil',
        tags: ['watch', 'junghans', 'bauhaus', 'swiss', 'luxury'],
        location: 'Milan, Italy 🇮🇹'
      },
      {
        title: 'Original Studio Ceramic Stoneware Vessel Set by Catalan Artisan',
        description: 'Five-piece sculptural wabi-sabi ceramic collection fired in wood kiln. Natural ash glaze with organic earth textures. Signed by Barcelona master potter.',
        category: 'Art',
        condition: 'New',
        estimatedValue: 650,
        listingType: 'barter',
        images: [
          'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&auto=format&fit=crop&q=80'
        ],
        owner: mateo._id,
        lookingFor: 'Shimano Ultegra disc wheelset or Acoustic travel guitar (Taylor GS Mini)',
        tags: ['art', 'ceramics', 'pottery', 'sculpture', 'barcelona'],
        location: 'Barcelona, Spain 🇪🇸'
      },
      {
        title: 'Rossignol Blackops Sender Ti Freeride Skis 180cm + Look Pivot 15',
        description: 'Top-tier big mountain freeride skis with titanal beam and Paulownia wood core. Fitted with legendary Look Pivot 15 metal alpine bindings. Waxed and edge tuned for the Alps.',
        category: 'Sports',
        condition: 'Like New',
        estimatedValue: 820,
        listingType: 'barter',
        images: [
          'https://images.unsplash.com/photo-1551524559-8af4e6624178?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=800&auto=format&fit=crop&q=80'
        ],
        owner: demo._id,
        lookingFor: 'GoPro Hero 12 Creator Edition or Ultralight 4-season alpine mountaineering tent',
        tags: ['ski', 'alps', 'winter', 'sports', 'vienna'],
        location: 'Vienna, Austria 🇦🇹'
      },

      // ==========================================
      // ===== 🏷️ SELL ITEMS (VENTES) [10 to 18] ==
      // ==========================================
      {
        title: 'Apple MacBook Pro 14" M3 Pro (Space Black, 18GB / 512GB SSD)',
        description: 'Liquid Retina XDR display with 120Hz ProMotion. European AZERTY/QWERTY layout available. 100% battery health (14 cycles). Includes European MagSafe 3 charger and original Apple receipt.',
        category: 'Electronics',
        condition: 'Like New',
        estimatedValue: 1900,
        listingType: 'sell',
        price: 1550,
        images: [
          'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80'
        ],
        owner: demo._id,
        lookingFor: 'Direct sale across EU (Insured DHL shipping available)',
        tags: ['apple', 'macbook', 'm3', 'laptop', 'milan'],
        location: 'Milan, Italy 🇮🇹'
      },
      {
        title: 'Bang & Olufsen Beoplay H95 Heritage Edition ANC Headphones',
        description: 'Danish mastercrafted titanium and lambskin wireless noise-cancelling headphones. Custom 40mm titanium drivers with neodymium magnets. Complete with brushed aluminum travel case.',
        category: 'Music',
        condition: 'Like New',
        estimatedValue: 690,
        listingType: 'sell',
        price: 490,
        images: [
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&auto=format&fit=crop&q=80'
        ],
        owner: julien._id,
        lookingFor: 'Direct sale / Virement bancaire / SEPA',
        tags: ['bangolufsen', 'audio', 'audiophile', 'luxury', 'paris'],
        location: 'Paris, France 🇫🇷'
      },
      {
        title: 'Rare First Folio Edition: "Le Petit Prince" Antoine de Saint-Exupéry',
        description: 'Numbered French collector edition with restored watercolor plates, clothbound hardcover, and embossed gold foil slipcase. Printed in Paris, pristine unread condition.',
        category: 'Books',
        condition: 'New',
        estimatedValue: 320,
        listingType: 'sell',
        price: 240,
        images: [
          'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&auto=format&fit=crop&q=80'
        ],
        owner: julien._id,
        lookingFor: 'Sale to bibliophile / collector',
        tags: ['books', 'french', 'literature', 'collector', 'paris'],
        location: 'Paris, France 🇫🇷'
      },
      {
        title: 'Barbour Heritage Classic Beaufort Waxed Jacket (Olive, Size 40)',
        description: 'Traditional English Thornproof waxed cotton jacket with signature tartan lining, storm fly front, and corduroy collar. Cleaned and rewaxed in London earlier this autumn.',
        category: 'Clothing',
        condition: 'Good',
        estimatedValue: 350,
        listingType: 'sell',
        price: 210,
        images: [
          'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1548883354-7622d03aca27?w=800&auto=format&fit=crop&q=80'
        ],
        owner: demo._id,
        lookingFor: 'For Sale across Europe',
        tags: ['barbour', 'outerwear', 'classic', 'heritage', 'vienna'],
        location: 'Vienna, Austria 🇦🇹'
      },
      {
        title: 'Le Creuset Signature Enamelled Cast Iron Dutch Oven 28cm (Cerise Red)',
        description: 'Authentic handcrafted French culinary masterpiece (6.7L capacity). Exceptional heat retention and distribution. Compatible with induction, gas, and oven up to 260°C.',
        category: 'Kitchen',
        condition: 'New',
        estimatedValue: 380,
        listingType: 'sell',
        price: 275,
        images: [
          'https://images.unsplash.com/photo-1584990347449-397a66c77bb3?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&auto=format&fit=crop&q=80'
        ],
        owner: julien._id,
        lookingFor: 'Selling to passionate home cooks',
        tags: ['lecreuset', 'kitchen', 'cookware', 'france', 'gourmet'],
        location: 'Paris, France 🇫🇷'
      },
      {
        title: 'Miyabi 5000MCD Birchwood Japanese Chef Knife (Gyuto 20cm)',
        description: 'Micro-carbide MC63 powdered steel core surrounded by 100 layers of Damascus steel. Handle carved from Karelian Masur Birch with mosaic pin. Razor sharpened in Solingen.',
        category: 'Kitchen',
        condition: 'Like New',
        estimatedValue: 340,
        listingType: 'sell',
        price: 230,
        images: [
          'https://images.unsplash.com/photo-1593618998160-e34014e67546?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=800&auto=format&fit=crop&q=80'
        ],
        owner: mateo._id,
        lookingFor: 'Sale with wooden Saya sheath included',
        tags: ['knife', 'kitchen', 'chef', 'damascus', 'barcelona'],
        location: 'Barcelona, Spain 🇪🇸'
      },
      {
        title: 'Fuji X100V Premium Compact Street Camera (Silver / Leather Case)',
        description: 'Beloved 26.1MP X-Trans CMOS 4 sensor with sharp 23mm F2 lens, hybrid optical/electronic viewfinder, and legendary film simulations (Classic Chrome & Portra). 4k shutter count.',
        category: 'Electronics',
        condition: 'Like New',
        estimatedValue: 1600,
        listingType: 'sell',
        price: 1380,
        images: [
          'https://images.unsplash.com/photo-1502982720700-bfff97f2ecac?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1510127034890-ba27508e9f1c?w=800&auto=format&fit=crop&q=80'
        ],
        owner: elena._id,
        lookingFor: 'Direct sale / Pick up in Berlin Mitte',
        tags: ['fujifilm', 'camera', 'streetphotography', 'berlin'],
        location: 'Berlin, Germany 🇩🇪'
      },
      {
        title: 'Italian Handcrafted Calfskin Leather Weekend Duffle Bag (Cognac)',
        description: 'Vegetable-tanned full-grain Tuscan leather with solid brass hardware, YKK Excella zippers, and reinforced leather handles. Meets European airline carry-on standards.',
        category: 'Clothing',
        condition: 'New',
        estimatedValue: 420,
        listingType: 'sell',
        price: 290,
        images: [
          'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&auto=format&fit=crop&q=80'
        ],
        owner: sofia._id,
        lookingFor: 'Direct sale / Shipping with tracked tracking',
        tags: ['leather', 'italian', 'bag', 'travel', 'milan'],
        location: 'Milan, Italy 🇮🇹'
      },
      {
        title: 'Nintendo Switch OLED Limited Edition + 5 Physical European Games',
        description: 'White OLED console with zero scratches. Includes dock, Pro Controller, travel case, and 5 boxed games: Zelda TOTK, Mario Odyssey, Metroid Dread, Pikmin 4, and Smash Bros Ultimate.',
        category: 'Toys',
        condition: 'Like New',
        estimatedValue: 450,
        listingType: 'sell',
        price: 330,
        images: [
          'https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1612287233207-e81fa2417724?w=800&auto=format&fit=crop&q=80'
        ],
        owner: demo._id,
        lookingFor: 'Sale to gaming enthusiast',
        tags: ['nintendo', 'switch', 'gaming', 'console', 'vienna'],
        location: 'Vienna, Austria 🇦🇹'
      },

      // ==========================================
      // ===== ⏱️ RENT ITEMS (LOCATIONS) [19 to 27]=
      // ==========================================
      {
        title: 'DJI Mini 4 Pro Drone + DJI RC 2 Controller + 3x Flight Batteries',
        description: 'Ultralight sub-249g 4K HDR drone with omnidirectional active obstacle sensing and D-Log M color profile. Perfect for weekend European alpine trips, city shoots, or architectural video.',
        category: 'Electronics',
        condition: 'Like New',
        estimatedValue: 890,
        listingType: 'rent',
        rentPrice: 38,
        rentPeriod: 'day',
        deposit: 150,
        images: [
          'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=800&auto=format&fit=crop&q=80'
        ],
        owner: elena._id,
        lookingFor: 'Available for daily or weekend rentals across Berlin & Brandenburg',
        tags: ['drone', 'dji', 'berlin', 'rental', 'video'],
        location: 'Berlin, Germany 🇩🇪'
      },
      {
        title: 'Rocket Appartamento Compact Espresso Machine (Polished Steel & Copper)',
        description: 'Handcrafted Milanese heat-exchanger espresso machine with E61 commercial group head. Available for film sets, culinary events, weddings, or weekend private pop-ups.',
        category: 'Kitchen',
        condition: 'Like New',
        estimatedValue: 1450,
        listingType: 'rent',
        rentPrice: 45,
        rentPeriod: 'day',
        deposit: 200,
        images: [
          'https://images.unsplash.com/photo-1517668808822-9ebb02ae2a0e?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&auto=format&fit=crop&q=80'
        ],
        owner: demo._id,
        lookingFor: 'Short-term event, catering & photo production rental in Milan',
        tags: ['espresso', 'coffee', 'milan', 'italian', 'rent'],
        location: 'Milan, Italy 🇮🇹'
      },
      {
        title: 'Festool TS 55 FEBQ Precision Plunge-Cut Track Saw System',
        description: 'German precision woodworking track saw with 1400mm guide rail and splinter guard. Cuts cabinet panels and hardwood countertops with splinter-free laser-accurate edges.',
        category: 'Tools',
        condition: 'Like New',
        estimatedValue: 680,
        listingType: 'rent',
        rentPrice: 24,
        rentPeriod: 'day',
        deposit: 100,
        images: [
          'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1581147036324-c17ac41dfa6c?w=800&auto=format&fit=crop&q=80'
        ],
        owner: lars._id,
        lookingFor: 'Rent for DIY renovation or artisan carpentry projects',
        tags: ['festool', 'woodworking', 'tools', 'germany', 'rent'],
        location: 'Amsterdam, Netherlands 🇳🇱'
      },
      {
        title: 'Original Parisian Gallery Oil Canvas "Lumière sur la Seine" (50x70cm)',
        description: 'Atmospheric French impressionist oil on textured linen canvas capturing twilight over the Pont Neuf in Paris. Ready to hang for luxury home staging, film sets, or seasonal interior decor.',
        category: 'Art',
        condition: 'New',
        estimatedValue: 850,
        listingType: 'rent',
        rentPrice: 65,
        rentPeriod: 'month',
        deposit: 150,
        images: [
          'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800&auto=format&fit=crop&q=80'
        ],
        owner: julien._id,
        lookingFor: 'Rental for luxury home staging, film productions & boutique hotel suites',
        tags: ['art', 'painting', 'paris', 'french', 'gallery'],
        location: 'Paris, France 🇫🇷'
      },
      {
        title: 'Sony FE 70-200mm f/2.8 GM OSS II Telephoto Cinema Lens',
        description: 'The world\'s lightest 70-200mm F2.8 telephoto zoom lens. Breathtaking bokeh, lightning autofocus, and 4 XD linear motors. Essential for weddings, concerts, sports, and documentaries.',
        category: 'Electronics',
        condition: 'Like New',
        estimatedValue: 2600,
        listingType: 'rent',
        rentPrice: 49,
        rentPeriod: 'day',
        deposit: 250,
        images: [
          'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop&q=80'
        ],
        owner: julien._id,
        lookingFor: 'Day/weekend rental for photographers and filmmakers visiting Paris',
        tags: ['lens', 'sony', 'camera', 'telephoto', 'paris'],
        location: 'Paris, France 🇫🇷'
      },
      {
        title: 'Aputure Light Storm LS 600d Pro Daylight LED Cinema Light Kit',
        description: '600W point-source daylight cinema fixture outputting over 100,000 lux at 1m with reflector. Weather-resistant IP54 rating, Bowens mount, wireless Sidus Link control, and flight case.',
        category: 'Electronics',
        condition: 'Like New',
        estimatedValue: 1800,
        listingType: 'rent',
        rentPrice: 55,
        rentPeriod: 'day',
        deposit: 200,
        images: [
          'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3?w=800&auto=format&fit=crop&q=80'
        ],
        owner: elena._id,
        lookingFor: 'Commercial video production and music video shoots in Berlin',
        tags: ['aputure', 'lighting', 'cinema', 'video', 'berlin'],
        location: 'Berlin, Germany 🇩🇪'
      },
      {
        title: 'Thule Motion XT XL Rooftop Cargo Box (500L Capacity)',
        description: 'Aerodynamic roof box with optimized volume efficiency. Dual-side opening with PowerClick quick-mount system. Perfect for European road trips and alpine ski holidays.',
        category: 'Vehicles',
        condition: 'Good',
        estimatedValue: 850,
        listingType: 'rent',
        rentPrice: 18,
        rentPeriod: 'day',
        deposit: 100,
        images: [
          'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&auto=format&fit=crop&q=80'
        ],
        owner: demo._id,
        lookingFor: 'Rent for family holidays, road trips across Austria & Bavaria',
        tags: ['thule', 'cargobox', 'travel', 'skiing', 'vienna'],
        location: 'Vienna, Austria 🇦🇹'
      },
      {
        title: 'DeWalt 54V XR FLEXVOLT Cordless Table Saw + Rolling Stand',
        description: 'Heavy duty brushless cordless table saw delivering full mains power. 610mm rip capacity, rack and pinion fence system. Includes 2x 9.0Ah batteries and rapid charger.',
        category: 'Tools',
        condition: 'Like New',
        estimatedValue: 1100,
        listingType: 'rent',
        rentPrice: 28,
        rentPeriod: 'day',
        deposit: 120,
        images: [
          'https://images.unsplash.com/photo-1581147036324-c17ac41dfa6c?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&auto=format&fit=crop&q=80'
        ],
        owner: lars._id,
        lookingFor: 'Rent for joinery and building renovations in North Holland',
        tags: ['dewalt', 'tablesaw', 'woodworking', 'tools', 'amsterdam'],
        location: 'Amsterdam, Netherlands 🇳🇱'
      },
      {
        title: 'Pioneer DJ XDJ-XZ Professional 4-Channel All-In-One DJ System',
        description: 'Club-standard all-in-one DJ system with full-size CDJ jog wheels, 7" touchscreen, and On-Jog color display. Ready for club gigs, private villa parties, or festivals in Barcelona.',
        category: 'Music',
        condition: 'Like New',
        estimatedValue: 2400,
        listingType: 'rent',
        rentPrice: 60,
        rentPeriod: 'day',
        deposit: 250,
        images: [
          'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80'
        ],
        owner: mateo._id,
        lookingFor: 'Rent for rooftop parties, club sets & events in Catalunya',
        tags: ['pioneer', 'dj', 'electronic', 'music', 'barcelona'],
        location: 'Barcelona, Spain 🇪🇸'
      }
    ];

    await Item.insertMany(sampleItems);
    console.log(`🇪🇺 Successfully seeded ${createdUsers.length} European users and ${sampleItems.length} items (9 Barter, 9 Sell, 9 Rent in €)!`);
  } catch (error) {
    console.error('❌ Error seeding European database:', error);
  }
}

module.exports = { seedDatabase };
