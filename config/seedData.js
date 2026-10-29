const mongoose = require('mongoose');
const User = require('../models/User');
const Item = require('../models/Item');
const Trade = require('../models/Trade');

const sampleUsers = [
  {
    username: 'aarav_mumbai',
    email: 'aarav@swapic.in',
    password: 'password123',
    bio: 'Architect, photographer & vintage Leica collector in Bandra, Mumbai. Open to gear exchanges, direct sales and pro camera rentals across India!',
    location: 'Mumbai, Maharashtra 🇮🇳',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    rating: { average: 4.95, count: 24, total: 119 },
    completedTrades: 21
  },
  {
    username: 'ananya_blr',
    email: 'ananya@swapic.in',
    password: 'password123',
    bio: 'Electronic music producer, audio engineer & analog synth enthusiast based in Indiranagar, Bengaluru.',
    location: 'Bengaluru, Karnataka 🇮🇳',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    rating: { average: 5.0, count: 28, total: 140 },
    completedTrades: 25
  },
  {
    username: 'rohit_delhi',
    email: 'rohit@swapic.in',
    password: 'password123',
    bio: 'Industrial product designer, gravel cyclist and bespoke furniture craftsman in Hauz Khas, Delhi NCR.',
    location: 'Delhi NCR 🇮🇳',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    rating: { average: 4.88, count: 18, total: 88 },
    completedTrades: 15
  },
  {
    username: 'priya_hyd',
    email: 'priya@swapic.in',
    password: 'password123',
    bio: 'Fashion curator, vintage watch collector & interior designer in Jubilee Hills, Hyderabad.',
    location: 'Hyderabad, Telangana 🇮🇳',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    rating: { average: 4.92, count: 32, total: 157 },
    completedTrades: 28
  },
  {
    username: 'vikram_pune',
    email: 'vikram@swapic.in',
    password: 'password123',
    bio: 'Tech maker, mechanical keyboard builder & drone pilot in Koregaon Park, Pune.',
    location: 'Pune, Maharashtra 🇮🇳',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    rating: { average: 4.85, count: 16, total: 78 },
    completedTrades: 13
  },
  {
    username: 'demo_india',
    email: 'demo@swapic.in',
    password: 'password123',
    bio: 'Official Swapic IN Verified Demo Account. Explore verified Indian peer-to-peer bartering, buying, and renting!',
    location: 'Bengaluru, Karnataka 🇮🇳',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    rating: { average: 4.98, count: 45, total: 224 },
    completedTrades: 42
  }
];

async function seedDatabase() {
  try {
    console.log('🇮🇳 Refreshing Swapic IN database with Indian users and items...');
    
    // Clear and create users
    await User.deleteMany({});
    const createdUsers = [];
    for (const u of sampleUsers) {
      const newUser = new User(u);
      await newUser.save();
      createdUsers.push(newUser);
    }

    const [aarav, ananya, rohit, priya, vikram, demo] = createdUsers;

    await Item.deleteMany({});

    const sampleItems = [
      // ==========================================
      // ===== 🔄 BARTER ITEMS (TROCS) [1 to 9] ===
      // ==========================================
      {
        title: 'Sony Alpha a7 IV Full-Frame Camera + Zeiss 35mm f/1.4 GM',
        description: 'Flagship 33MP full-frame hybrid camera with 4K/60p video, 10-bit 4:2:2, and S-Cinetone. Sensor is in pristine condition. Includes genuine Sony FE 35mm f/1.4 GM lens, 3 original batteries, and India warranty papers.',
        category: 'Electronics',
        condition: 'Like New',
        estimatedValue: 185000,
        listingType: 'barter',
        images: [
          'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&auto=format&fit=crop&q=80'
        ],
        owner: aarav._id,
        lookingFor: 'Vintage Leica M6 / M11 body or Moog Matriarch analog synthesizer',
        tags: ['sony', 'camera', 'photography', 'leica', 'mumbai'],
        location: 'Mumbai, Maharashtra 🇮🇳'
      },
      {
        title: 'Fender Player Plus Stratocaster HSS (Tequila Sunrise Finish)',
        description: 'Authentic Fender Stratocaster featuring Player Plus Noiseless pickups, 12" radius pau ferro fingerboard, and locking tuners. Tone is sparkling and punchy. Includes deluxe gig bag.',
        category: 'Music',
        condition: 'Like New',
        estimatedValue: 68000,
        listingType: 'barter',
        images: [
          'https://images.unsplash.com/photo-1516924962500-2b4b3b99ea02?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1525201548942-d8732f6617a0?w=800&auto=format&fit=crop&q=80'
        ],
        owner: ananya._id,
        lookingFor: 'Genelec 8030 studio monitors or Roland Juno synth',
        tags: ['fender', 'stratocaster', 'guitar', 'music', 'bengaluru'],
        location: 'Bengaluru, Karnataka 🇮🇳'
      },
      {
        title: 'Trek Marlin 7 Gen 3 Hardtail Mountain Bike (Size L / 29er)',
        description: 'Premium cross-country mountain bicycle. Shimano Deore 1x10 drivetrain, RockShox Judy fork with lockout, and hydraulic disc brakes. Perfect for trails around Aravali or Nandi Hills.',
        category: 'Sports',
        condition: 'Like New',
        estimatedValue: 52000,
        listingType: 'barter',
        images: [
          'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?w=800&auto=format&fit=crop&q=80'
        ],
        owner: rohit._id,
        lookingFor: 'Gravel bicycle frame (56cm) or Apple Watch Ultra 2',
        tags: ['trek', 'marlin', 'bicycle', 'cycling', 'delhi'],
        location: 'Delhi NCR 🇮🇳'
      },
      {
        title: 'Herman Miller Aeron Remastered Ergonomic Chair (Size B, Graphite)',
        description: 'Industry benchmark office chair featuring 8Z Pellicle mesh, fully adjustable arms, PostureFit SL sacral support, and tilt limiter. Excellent lumbar comfort for long dev hours.',
        category: 'Furniture',
        condition: 'Like New',
        estimatedValue: 78000,
        listingType: 'barter',
        images: [
          'https://images.unsplash.com/photo-1580481077195-c990b797fc78?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&auto=format&fit=crop&q=80'
        ],
        owner: ananya._id,
        lookingFor: 'Solid teak wood designer credenza or Studio desk with rack mounts',
        tags: ['hermanmiller', 'aeron', 'chair', 'ergonomic', 'bengaluru'],
        location: 'Bengaluru, Karnataka 🇮🇳'
      },
      {
        title: 'Apple iPad Pro 12.9" M2 (128GB Wi-Fi) + Apple Pencil 2',
        description: 'Liquid Retina XDR display with ProMotion 120Hz. Flawless condition, always kept in Smart Folio. Includes Apple Pencil 2nd Gen and original 20W charger.',
        category: 'Electronics',
        condition: 'Like New',
        estimatedValue: 85000,
        listingType: 'barter',
        images: [
          'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=800&auto=format&fit=crop&q=80'
        ],
        owner: priya._id,
        lookingFor: 'Sony FE 70-200mm f/4 G II lens or Wacom Cintiq 16',
        tags: ['apple', 'ipad', 'm2', 'pro', 'hyderabad'],
        location: 'Hyderabad, Telangana 🇮🇳'
      },
      {
        title: 'Teenage Engineering OP-1 Field Portable Synthesizer',
        description: 'Iconic all-in-one synthesizer, sampler, and 4-track tape recorder. Aluminum body, stereo signal chain throughout, 24-hour battery life. Mint in box.',
        category: 'Music',
        condition: 'Like New',
        estimatedValue: 125000,
        listingType: 'barter',
        images: [
          'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&auto=format&fit=crop&q=80'
        ],
        owner: vikram._id,
        lookingFor: 'Elektron Octatrack MKII or Elektron Syntakt + Digitakt',
        tags: ['teenageengineering', 'op1', 'synth', 'music', 'pune'],
        location: 'Pune, Maharashtra 🇮🇳'
      },
      {
        title: 'Royal Enfield Interceptor 650 Custom Exhaust & Touring Kit',
        description: 'Full stainless steel slip-on exhaust system with removable DB killers for 650 Twins, plus genuine RE tall flyscreen, touring dual seat, and sump guard.',
        category: 'Vehicles',
        condition: 'Good',
        estimatedValue: 34000,
        listingType: 'barter',
        images: [
          'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&auto=format&fit=crop&q=80'
        ],
        owner: aarav._id,
        lookingFor: 'DJI Action 4 Adventure Combo or Dainese mesh jacket',
        tags: ['royalenfield', 'interceptor', 'exhaust', 'motorcycle', 'mumbai'],
        location: 'Mumbai, Maharashtra 🇮🇳'
      },
      {
        title: 'Marshall Stanmore III Bluetooth Wireless Speaker',
        description: 'Iconic Marshall vintage brass styling, re-engineered wider soundstage, Bluetooth 5.2, and 3.5mm AUX input. Rich punchy bass and crystalline highs.',
        category: 'Electronics',
        condition: 'Like New',
        estimatedValue: 31000,
        listingType: 'barter',
        images: [
          'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&auto=format&fit=crop&q=80'
        ],
        owner: rohit._id,
        lookingFor: 'Audio-Technica LP120XUSB turntable with vinyl records',
        tags: ['marshall', 'speaker', 'audio', 'bluetooth', 'delhi'],
        location: 'Delhi NCR 🇮🇳'
      },
      {
        title: 'DJI Mini 4 Pro Fly More Combo Drone with RC 2 Screen Controller',
        description: 'Under 249g lightweight drone with omnidirectional obstacle sensing, 4K/60fps HDR true vertical shooting, and 20km FHD video transmission. Includes 3 intelligent flight batteries and charging hub.',
        category: 'Electronics',
        condition: 'Like New',
        estimatedValue: 88000,
        listingType: 'barter',
        images: [
          'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=800&auto=format&fit=crop&q=80'
        ],
        owner: demo._id,
        lookingFor: 'Insta360 X4 8K camera or Sony FE 24mm f/1.4 GM lens',
        tags: ['dji', 'drone', 'mini4pro', 'aerial', 'bengaluru'],
        location: 'Bengaluru, Karnataka 🇮🇳'
      },

      // ==========================================
      // ===== 🏷️ DIRECT SALE ITEMS (VENTE) [10 to 18]
      // ==========================================
      {
        title: 'Apple MacBook Pro 14" M3 Pro (18GB Unified RAM, 512GB SSD)',
        description: 'Space Black finish. Liquid Retina XDR screen, 11-core CPU, 14-core GPU. Battery health 98% (only 34 cycles). Complete with 70W MagSafe charger and original box.',
        category: 'Electronics',
        condition: 'Like New',
        estimatedValue: 165000,
        listingType: 'sell',
        price: 148000,
        images: [
          'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800&auto=format&fit=crop&q=80'
        ],
        owner: ananya._id,
        tags: ['apple', 'macbook', 'm3', 'laptop', 'bengaluru'],
        location: 'Bengaluru, Karnataka 🇮🇳'
      },
      {
        title: 'Fujifilm X100V Compact Mirrorless Camera (Silver Edition)',
        description: 'Legendary 26.1MP X-Trans CMOS 4 sensor with fixed 23mm f/2 lens, hybrid optical/electronic viewfinder, and classic film simulations. Shutter count only 4,100.',
        category: 'Electronics',
        condition: 'Good',
        estimatedValue: 120000,
        listingType: 'sell',
        price: 112000,
        images: [
          'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop&q=80'
        ],
        owner: aarav._id,
        tags: ['fujifilm', 'x100v', 'camera', 'street', 'mumbai'],
        location: 'Mumbai, Maharashtra 🇮🇳'
      },
      {
        title: 'Bang & Olufsen Beoplay H95 Flagship Wireless ANC Headphones',
        description: 'Crafted from titanium, lambskin leather, and memory foam. Adaptive active noise cancellation, custom 40mm titanium drivers, and up to 38 hours playback. Includes aluminum hard case.',
        category: 'Electronics',
        condition: 'Like New',
        estimatedValue: 58000,
        listingType: 'sell',
        price: 46000,
        images: [
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&auto=format&fit=crop&q=80'
        ],
        owner: priya._id,
        tags: ['bangolufsen', 'headphones', 'anc', 'audiophile', 'hyderabad'],
        location: 'Hyderabad, Telangana 🇮🇳'
      },
      {
        title: 'RADO Captain Cook Automatic 42mm Diver Watch (Green Dial)',
        description: 'High-tech ceramic rotating bezel with sunray green dial, sapphire crystal, and 80-hour power reserve. Stainless steel beads-of-rice bracelet with extra leather strap.',
        category: 'Jewelry',
        condition: 'Like New',
        estimatedValue: 165000,
        listingType: 'sell',
        price: 138000,
        images: [
          'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&auto=format&fit=crop&q=80'
        ],
        owner: priya._id,
        tags: ['rado', 'watch', 'automatic', 'luxury', 'hyderabad'],
        location: 'Hyderabad, Telangana 🇮🇳'
      },
      {
        title: 'Specialized Allez E5 Sport Road Bicycle (Size 54cm)',
        description: 'Lightweight E5 alloy frame with full carbon fork, Shimano Sora 2x9 groupset, and Axis Sport wheelset. Tuned and road ready for morning cycling clubs.',
        category: 'Sports',
        condition: 'Good',
        estimatedValue: 65000,
        listingType: 'sell',
        price: 54000,
        images: [
          'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=800&auto=format&fit=crop&q=80'
        ],
        owner: rohit._id,
        tags: ['specialized', 'roadbike', 'cycling', 'sports', 'delhi'],
        location: 'Delhi NCR 🇮🇳'
      },
      {
        title: 'Breville Barista Touch Stainless Steel Espresso Machine',
        description: 'Automated touchscreen bean-to-cup espresso with pre-programmed cafe drinks, ThermoJet 3-second heat-up, and automatic micro-foam steam wand. Includes bottomless portafilter.',
        category: 'Kitchen',
        condition: 'Like New',
        estimatedValue: 75000,
        listingType: 'sell',
        price: 64000,
        images: [
          'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&auto=format&fit=crop&q=80'
        ],
        owner: aarav._id,
        tags: ['breville', 'coffee', 'espresso', 'kitchen', 'mumbai'],
        location: 'Mumbai, Maharashtra 🇮🇳'
      },
      {
        title: 'Dyson V12 Detect Slim Cordless Vacuum Cleaner',
        description: 'Laser reveals microscopic dust on hard floors. Single-button power control, Piezo acoustic sensor, hair screw anti-tangle tool. Battery runtime up to 60 mins.',
        category: 'Home',
        condition: 'Like New',
        estimatedValue: 44000,
        listingType: 'sell',
        price: 36000,
        images: [
          'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&auto=format&fit=crop&q=80'
        ],
        owner: ananya._id,
        tags: ['dyson', 'vacuum', 'cleaning', 'home', 'bengaluru'],
        location: 'Bengaluru, Karnataka 🇮🇳'
      },
      {
        title: 'DJI RS 3 Pro Gimbal Stabilizer Combo',
        description: 'Carbon fiber motorized 3-axis stabilizer with automated axis locks, 4.5kg tested payload, LiDAR focusing system, and Ronin image transmitter. Built for cinema cameras.',
        category: 'Electronics',
        condition: 'Like New',
        estimatedValue: 62000,
        listingType: 'sell',
        price: 51000,
        images: [
          'https://images.unsplash.com/photo-1589872765806-039c636f3db1?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop&q=80'
        ],
        owner: vikram._id,
        tags: ['dji', 'gimbal', 'rs3pro', 'cinema', 'pune'],
        location: 'Pune, Maharashtra 🇮🇳'
      },
      {
        title: 'Sennheiser MKH 416 Short Shotgun Interference Microphone',
        description: 'The golden standard broadcast and film location boom microphone. High directivity, low self-noise, high consonant articulation, and extreme feedback rejection.',
        category: 'Music',
        condition: 'Like New',
        estimatedValue: 72000,
        listingType: 'sell',
        price: 59000,
        images: [
          'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1520523839898-507125cd53c1?w=800&auto=format&fit=crop&q=80'
        ],
        owner: demo._id,
        tags: ['sennheiser', 'microphone', 'boom', 'sound', 'bengaluru'],
        location: 'Bengaluru, Karnataka 🇮🇳'
      },

      // ==========================================
      // ===== ⏱️ GEAR RENTALS [19 to 27] =========
      // ==========================================
      {
        title: 'Sony FX3 Cinema Line Full-Frame Camera + Cage Rig',
        description: 'Compact cinema camera with full-frame sensor, 4K 120p, 15+ stops dynamic range, S-Cinetone, active cooling fan, and XLR handle unit. Rent for indie films, ad commercials & music videos in Mumbai.',
        category: 'Electronics',
        condition: 'Like New',
        estimatedValue: 310000,
        listingType: 'rent',
        rentPrice: 3200,
        rentPeriod: 'day',
        deposit: 20000,
        images: [
          'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&auto=format&fit=crop&q=80'
        ],
        owner: aarav._id,
        tags: ['sony', 'fx3', 'cinema', 'video', 'mumbai'],
        location: 'Mumbai, Maharashtra 🇮🇳'
      },
      {
        title: 'Aputure LS 600d Pro Daylight Studio LED Light + Light Dome III',
        description: '600W COB daylight-balanced LED fixture producing output comparable to 1200W HMI. Weather-resistant with Sidus Link app control. Essential for commercial shoots in Bengaluru.',
        category: 'Electronics',
        condition: 'Like New',
        estimatedValue: 185000,
        listingType: 'rent',
        rentPrice: 1800,
        rentPeriod: 'day',
        deposit: 12000,
        images: [
          'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3?w=800&auto=format&fit=crop&q=80'
        ],
        owner: ananya._id,
        tags: ['aputure', 'lighting', 'cinema', 'production', 'bengaluru'],
        location: 'Bengaluru, Karnataka 🇮🇳'
      },
      {
        title: 'Pioneer DJ XDJ-XZ Professional 4-Channel All-In-One System',
        description: 'Club-standard all-in-one DJ system with full-size CDJ jog wheels, 7" touchscreen, and On-Jog color display. Ready for club gigs, private events, or festival sets in Delhi NCR.',
        category: 'Music',
        condition: 'Like New',
        estimatedValue: 220000,
        listingType: 'rent',
        rentPrice: 4200,
        rentPeriod: 'day',
        deposit: 25000,
        images: [
          'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80'
        ],
        owner: rohit._id,
        tags: ['pioneer', 'dj', 'xdj', 'music', 'delhi'],
        location: 'Delhi NCR 🇮🇳'
      },
      {
        title: 'Yakima SkyBox 16 Carbon Aerodynamic Rooftop Box (450L)',
        description: 'Dual-side opening roof box with quick-release mounting. Perfect for family road trips, Leh-Ladakh expeditions, and western ghats getaways.',
        category: 'Vehicles',
        condition: 'Good',
        estimatedValue: 75000,
        listingType: 'rent',
        rentPrice: 850,
        rentPeriod: 'day',
        deposit: 6000,
        images: [
          'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&auto=format&fit=crop&q=80'
        ],
        owner: demo._id,
        tags: ['yakima', 'roofbox', 'travel', 'roadtrip', 'bengaluru'],
        location: 'Bengaluru, Karnataka 🇮🇳'
      },
      {
        title: 'DeWalt 54V XR FLEXVOLT Heavy Duty Cordless Table Saw & Stand',
        description: 'Brushless cordless table saw with 610mm rip capacity, rack and pinion fence system, 2x 9.0Ah batteries and rapid charger. Rent for carpentry and interior renovation in Pune.',
        category: 'Tools',
        condition: 'Like New',
        estimatedValue: 95000,
        listingType: 'rent',
        rentPrice: 1100,
        rentPeriod: 'day',
        deposit: 8000,
        images: [
          'https://images.unsplash.com/photo-1581147036324-c17ac41dfa6c?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&auto=format&fit=crop&q=80'
        ],
        owner: vikram._id,
        tags: ['dewalt', 'tablesaw', 'tools', 'woodworking', 'pune'],
        location: 'Pune, Maharashtra 🇮🇳'
      },
      {
        title: 'Moog Subsequent 37 Paraphonic Analog Synthesizer',
        description: 'Award-winning two-note paraphonic analog synth with 37 semi-weighted keys, multidrive saturation, and arpeggiator/sequencer. Available for music production in Mumbai.',
        category: 'Music',
        condition: 'Like New',
        estimatedValue: 145000,
        listingType: 'rent',
        rentPrice: 2000,
        rentPeriod: 'day',
        deposit: 15000,
        images: [
          'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80'
        ],
        owner: aarav._id,
        tags: ['moog', 'synth', 'analog', 'music', 'mumbai'],
        location: 'Mumbai, Maharashtra 🇮🇳'
      },
      {
        title: 'Canon RF 70-200mm f/2.8L IS USM Professional Telephoto Zoom',
        description: 'Compact L-series telephoto zoom for Canon EOS R system. 5-stop image stabilization, dual Nano USM motors, weather sealing. Rent for weddings & cricket matches in Hyderabad.',
        category: 'Electronics',
        condition: 'Like New',
        estimatedValue: 225000,
        listingType: 'rent',
        rentPrice: 2200,
        rentPeriod: 'day',
        deposit: 18000,
        images: [
          'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&auto=format&fit=crop&q=80'
        ],
        owner: priya._id,
        tags: ['canon', 'lens', '70200', 'photography', 'hyderabad'],
        location: 'Hyderabad, Telangana 🇮🇳'
      },
      {
        title: 'Blackmagic Pocket Cinema Camera 6K Pro + Tilta Rig Kit',
        description: 'Super 35 HDR sensor, built-in motorized ND filters, 1500 nit tilting HDR screen, dual native ISO up to 25,600. Includes Samsung T7 SSD and V-mount battery plate.',
        category: 'Electronics',
        condition: 'Like New',
        estimatedValue: 240000,
        listingType: 'rent',
        rentPrice: 2800,
        rentPeriod: 'day',
        deposit: 20000,
        images: [
          'https://images.unsplash.com/photo-1589872765806-039c636f3db1?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop&q=80'
        ],
        owner: demo._id,
        tags: ['blackmagic', 'bmpcc6k', 'cinema', 'camera', 'bengaluru'],
        location: 'Bengaluru, Karnataka 🇮🇳'
      },
      {
        title: 'Insta360 Pro 2 8K 3D 360 VR Camera & Farsight System',
        description: 'Professional 6-lens 8K 360 degree 3D virtual reality camera with FlowState stabilization, 9-axis gyro, and live streaming capabilities for virtual real estate & concerts.',
        category: 'Electronics',
        condition: 'Like New',
        estimatedValue: 380000,
        listingType: 'rent',
        rentPrice: 4800,
        rentPeriod: 'day',
        deposit: 30000,
        images: [
          'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=800&auto=format&fit=crop&q=80'
        ],
        owner: ananya._id,
        tags: ['insta360', 'vr', '360camera', 'bengaluru'],
        location: 'Bengaluru, Karnataka 🇮🇳'
      }
    ];

    const insertedItems = await Item.insertMany(sampleItems);

    // Seed completed sample trade with review
    await Trade.deleteMany({});
    const sampleTrade = new Trade({
      proposer: aarav._id,
      receiver: ananya._id,
      offeredItems: [insertedItems[0]._id],
      requestedItems: [insertedItems[1]._id],
      message: 'Great exchange! Sony A7IV swapped for Fender Stratocaster in Bengaluru.',
      status: 'completed',
      escrowStatus: 'released',
      completedAt: new Date(Date.now() - 86400000 * 3),
      rating: {
        proposerRating: 5,
        proposerReview: 'Aarav was super prompt and courteous! Camera was in pristine condition as described. 10/10 Swapic trader!',
        receiverRating: 5,
        receiverReview: 'Fantastic experience trading with Ananya in Bengaluru. The guitar was packed securely and handed over seamlessly.'
      }
    });
    await sampleTrade.save();

    console.log(`🇮🇳 Successfully seeded ${createdUsers.length} Indian users, ${sampleItems.length} items (9 Barter, 9 Sell, 9 Rent in ₹ INR), and verified trade reviews!`);
  } catch (error) {
    console.error('❌ Error seeding Indian database:', error);
  }
}

module.exports = { seedDatabase };
