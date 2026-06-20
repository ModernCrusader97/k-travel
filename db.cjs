const { Pool } = require('pg')

const pool = new Pool({
  host: 'localhost',
  database: 'konda',
  user: 'claude',
  password: 'konda2025',
  port: 5432,
})

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      name VARCHAR(100),
      created_at TIMESTAMP DEFAULT NOW(),
      verified BOOLEAN DEFAULT FALSE
    );

    CREATE TABLE IF NOT EXISTS cards (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL DEFAULT 'standard',
      status VARCHAR(50) NOT NULL DEFAULT 'pending',
      card_number VARCHAR(20),
      color VARCHAR(30) DEFAULT 'black',
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS balances (
      user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      krw BIGINT NOT NULL DEFAULT 0,
      usd NUMERIC(12,2) NOT NULL DEFAULT 0,
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL,
      amount BIGINT NOT NULL,
      currency VARCHAR(10) NOT NULL DEFAULT 'KRW',
      description VARCHAR(255),
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS card_applications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      card_type VARCHAR(50) NOT NULL,
      color VARCHAR(30),
      status VARCHAR(50) NOT NULL DEFAULT 'pending',
      submitted_at TIMESTAMP DEFAULT NOW(),
      approved_at TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS acorns (
      user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      balance BIGINT NOT NULL DEFAULT 0,
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS acorn_transactions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL,
      amount BIGINT NOT NULL,
      description VARCHAR(255),
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS mission_progress (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      mission_id VARCHAR(50) NOT NULL,
      last_claimed_at TIMESTAMP,
      total_claimed INTEGER NOT NULL DEFAULT 0,
      UNIQUE(user_id, mission_id)
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      place_id INTEGER,
      article_id INTEGER,
      place_name VARCHAR(255),
      type VARCHAR(20) NOT NULL DEFAULT 'text',
      content TEXT,
      rating INTEGER,
      keywords TEXT[],
      helpful_count INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS review_helpful (
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      review_id INTEGER REFERENCES reviews(id) ON DELETE CASCADE,
      PRIMARY KEY (user_id, review_id)
    );

    CREATE TABLE IF NOT EXISTS vouchers (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      brand VARCHAR(100) NOT NULL,
      name VARCHAR(255) NOT NULL,
      barcode VARCHAR(100) NOT NULL,
      category VARCHAR(50),
      expiry_date TIMESTAMP NOT NULL,
      used_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      body TEXT,
      type VARCHAR(50) DEFAULT 'general',
      read_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS kyc_submissions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
      passport_number VARCHAR(50),
      full_name VARCHAR(100),
      birth_date DATE,
      gender VARCHAR(10),
      status VARCHAR(30) DEFAULT 'pending',
      submitted_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS user_settings (
      user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      language VARCHAR(10) DEFAULT 'ko',
      push_payment BOOLEAN DEFAULT TRUE,
      push_promo BOOLEAN DEFAULT TRUE,
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS transit_cards (
      user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      balance BIGINT NOT NULL DEFAULT 0,
      last_used_at TIMESTAMP,
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS money_transfers (
      id SERIAL PRIMARY KEY,
      sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      receiver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      amount BIGINT NOT NULL,
      currency VARCHAR(10) NOT NULL DEFAULT 'KRW',
      note VARCHAR(255),
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS support_tickets (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      subject VARCHAR(255) NOT NULL,
      body TEXT,
      category VARCHAR(50) DEFAULT 'general',
      status VARCHAR(30) DEFAULT 'open',
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS card_requests (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL,
      details JSONB,
      status VARCHAR(30) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS places (
      id SERIAL PRIMARY KEY,
      city VARCHAR(50) NOT NULL,
      name VARCHAR(255) NOT NULL,
      name_en VARCHAR(255),
      category VARCHAR(50) NOT NULL,
      description TEXT,
      address VARCHAR(255),
      lat NUMERIC(10,7),
      lng NUMERIC(10,7),
      rating NUMERIC(3,1) DEFAULT 4.5,
      review_count INTEGER DEFAULT 0,
      image_emoji VARCHAR(10) DEFAULT '📍',
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS articles (
      id SERIAL PRIMARY KEY,
      category VARCHAR(50) NOT NULL,
      title VARCHAR(255) NOT NULL,
      subtitle VARCHAR(255),
      description TEXT,
      bg_style VARCHAR(500),
      is_place BOOLEAN DEFAULT FALSE,
      rating NUMERIC(3,1),
      review_count INTEGER,
      content JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS atm_locations (
      id SERIAL PRIMARY KEY,
      bank VARCHAR(100) NOT NULL,
      address VARCHAR(255) NOT NULL,
      city VARCHAR(50) NOT NULL,
      lat NUMERIC(10,7),
      lng NUMERIC(10,7),
      hours VARCHAR(100) DEFAULT '24시간',
      accepts_foreign BOOLEAN DEFAULT TRUE
    );
  `)

  await seedData()
  console.log('[db] tables ready')
}

async function seedData() {
  // Places seed
  const existingPlaces = await pool.query('SELECT COUNT(*) FROM places')
  if (parseInt(existingPlaces.rows[0].count) === 0) {
    const places = [
      // Seoul
      ['서울', '경복궁', 'Gyeongbokgung Palace', '역사', '조선왕조 첫 번째 궁궐. 500년 왕조의 중심지로 웅장한 건축미와 수문장 교대식을 볼 수 있어요.', '서울 종로구 사직로 161', 37.5796, 126.9770, 4.8, 2341, '🏛'],
      ['서울', '남산서울타워', 'N Seoul Tower', '명소', '서울 시내를 한눈에 내려다볼 수 있는 랜드마크. 야경이 특히 아름다워요.', '서울 용산구 남산공원길 105', 37.5512, 126.9882, 4.6, 1892, '🗼'],
      ['서울', '인사동', 'Insadong', '쇼핑', '전통 공예품과 갤러리, 한옥 찻집이 즐비한 문화 거리예요.', '서울 종로구 인사동길', 37.5745, 126.9845, 4.5, 987, '🎎'],
      ['서울', '홍대 거리', 'Hongdae', '엔터테인먼트', '젊음과 예술이 넘치는 클럽 거리. 버스킹과 독립 카페가 가득해요.', '서울 마포구 와우산로', 37.5563, 126.9235, 4.4, 1543, '🎵'],
      ['서울', '광장시장', 'Gwangjang Market', '음식', '100년 역사의 전통 시장. 빈대떡, 마약김밥, 순대가 유명해요.', '서울 종로구 창경궁로 88', 37.5700, 126.9994, 4.7, 2108, '🥘'],
      ['서울', '한강공원', 'Han River Park', '자연', '자전거, 피크닉, 야경을 즐길 수 있는 서울 시민의 휴식처예요.', '서울 영등포구 여의동로 330', 37.5285, 126.9326, 4.5, 1234, '🌊'],
      ['서울', '명동', 'Myeongdong', '쇼핑', '화장품, 패션, 길거리 음식이 가득한 서울 최대 쇼핑 거리예요.', '서울 중구 명동길', 37.5636, 126.9828, 4.3, 3201, '🛍'],
      ['서울', '창덕궁', 'Changdeokgung', '역사', '유네스코 세계문화유산. 비원(후원)의 자연 정원이 압권이에요.', '서울 종로구 율곡로 99', 37.5792, 126.9910, 4.7, 876, '🌿'],
      // Busan
      ['부산', '해운대해수욕장', 'Haeundae Beach', '자연', '한국 최대의 해수욕장. 여름 피서지로 국내외 관광객이 몰려요.', '부산 해운대구 해운대해변로 264', 35.1588, 129.1603, 4.6, 2987, '🏖'],
      ['부산', '감천문화마을', 'Gamcheon Culture Village', '명소', '알록달록한 집들이 계단식으로 이어진 부산의 마추픽추예요.', '부산 사하구 감내2로 203', 35.0979, 129.0101, 4.7, 1654, '🎨'],
      ['부산', '자갈치시장', 'Jagalchi Market', '음식', '한국 최대의 수산시장. 신선한 회와 해산물을 맛볼 수 있어요.', '부산 중구 자갈치해안로 52', 35.0967, 129.0302, 4.5, 1123, '🐟'],
      ['부산', '광안리해수욕장', 'Gwangalli Beach', '자연', '광안대교 야경이 아름다운 해변. 카페와 레스토랑이 줄지어 있어요.', '부산 수영구 광안해변로 219', 35.1530, 129.1185, 4.6, 987, '🌉'],
      // Jeju
      ['제주', '성산일출봉', 'Seongsan Ilchulbong', '자연', '유네스코 세계자연유산. 일출 명소로 분화구 트레킹이 가능해요.', '제주 서귀포시 성산읍 일출로 284-12', 33.4580, 126.9425, 4.8, 3421, '🌋'],
      ['제주', '한라산', 'Hallasan Mountain', '자연', '제주도의 상징. 한국에서 가장 높은 산으로 등산 코스가 다양해요.', '제주 제주시 1100로 2070-61', 33.3617, 126.5292, 4.9, 2109, '⛰'],
      ['제주', '우도', 'Udo Island', '자연', '제주 동쪽 작은 섬. 에메랄드빛 바다와 땅콩아이스크림으로 유명해요.', '제주 제주시 우도면', 33.5023, 126.9517, 4.7, 1456, '🏝'],
      ['제주', '협재해수욕장', 'Hyeopjae Beach', '자연', '제주 서쪽의 에메랄드빛 해변. 비양도가 보이는 풍경이 아름다워요.', '제주 제주시 한림읍 협재리 2497-1', 33.3943, 126.2391, 4.6, 876, '🌺'],
      // Gyeongju
      ['경주', '불국사', 'Bulguksa Temple', '역사', '유네스코 세계문화유산. 신라 불교 문화의 정수를 담은 천년 고찰이에요.', '경북 경주시 불국로 385', 35.7898, 129.3316, 4.8, 1876, '🏯'],
      ['경주', '첨성대', 'Cheomseongdae Observatory', '역사', '동양에서 가장 오래된 천문대. 선덕여왕 때 세워진 신라의 상징이에요.', '경북 경주시 인왕동 839-1', 35.8349, 129.2196, 4.5, 987, '🌙'],
      // Incheon
      ['인천', '차이나타운', 'Chinatown', '문화', '한국 유일의 차이나타운. 짜장면의 발상지로 다양한 중식 음식점이 있어요.', '인천 중구 차이나타운로 36', 37.4750, 126.6172, 4.3, 765, '🏮'],
      // Suwon
      ['수원', '수원화성', 'Hwaseong Fortress', '역사', '유네스코 세계문화유산. 조선시대 정조가 쌓은 성곽으로 야경이 멋져요.', '경기 수원시 팔달구 행궁로 105', 37.2865, 127.0136, 4.7, 1234, '🏰'],
    ]

    for (const [city, name, name_en, category, description, address, lat, lng, rating, review_count, image_emoji] of places) {
      await pool.query(
        `INSERT INTO places (city, name, name_en, category, description, address, lat, lng, rating, review_count, image_emoji)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [city, name, name_en, category, description, address, lat, lng, rating, review_count, image_emoji]
      )
    }
    console.log('[db] places seeded')
  }

  // Articles seed
  const existingArticles = await pool.query('SELECT COUNT(*) FROM articles')
  if (parseInt(existingArticles.rows[0].count) === 0) {
    const articles = [
      {
        category: 'Place',
        title: '한국 여행와서\n여기 안가면 바보',
        subtitle: '한시점 가장 핫한 플레이스 모음집',
        description: '주요 도시의 관광명소부터 자연과 어우러지는 관광지까지, 국내 및 전 세계에 우리나라의 우수한 관광지를 소개합니다.',
        bg_style: 'linear-gradient(160deg, #2d4a3e 0%, #4a7c59 50%, #6b9e7a 100%)',
        is_place: true,
        rating: 4.7,
        review_count: 190,
        content: [
          { title: "첫 번째 핫플: 서촌 '미로'의 시간여행", body: '"북촌은 가봤는데 서촌은 잘 몰라요" 이런 분들 정말 많이 오시죠. 저도 처음엔 서촌 하면 그냥 한옥마을의 조용한 버전이라고만 생각했어요. 하지만 서촌은 좁고 오밀조밀한 골목에 숨겨진 독특한 공간들이 가득한 곳이에요.' }
        ]
      },
      {
        category: 'How',
        title: '한국여행 필수품\n콘다카드 활용팁',
        subtitle: '등록부터 할인 받는 꿀팁까지',
        description: '콘다카드 하나로 교통, 쇼핑, 식사까지 한국 여행의 모든 결제를 해결하세요.',
        bg_style: 'linear-gradient(135deg, #F5C300 0%, #e6b200 40%, #1a1a1a 40%, #1a1a1a 100%)',
        is_place: false,
        rating: null,
        review_count: null,
        content: [
          { title: '카드 등록하는 법', body: '앱 다운로드 후 카드 탭에서 Register 버튼을 눌러 카드를 등록하세요.' },
          { title: '페이백 최대로 받는 방법', body: '제휴 매장에서 결제하면 최대 5%까지 페이백을 받을 수 있어요.' }
        ]
      },
      {
        category: 'Place',
        title: '서울 숨겨진\n로컬 맛집 TOP 10',
        subtitle: '현지인만 아는 특별한 장소',
        description: '관광객들이 잘 모르는 서울의 숨은 맛집들을 소개해드려요.',
        bg_style: 'linear-gradient(160deg, #5a3e2b 0%, #8b6343 50%, #c49a6c 100%)',
        is_place: false,
        rating: null,
        review_count: null,
        content: [
          { title: '성동구 로컬 맛집', body: '성수동 일대에는 SNS에 잘 알려지지 않은 로컬 식당들이 많아요.' }
        ]
      },
      {
        category: 'Gourmet',
        title: '놓치면 후회하는\n한국 길거리 음식',
        subtitle: '명동부터 홍대까지 먹방 투어',
        description: '한국의 다채로운 길거리 음식을 맛보세요.',
        bg_style: 'linear-gradient(160deg, #c0392b 0%, #e74c3c 50%, #f39c12 100%)',
        is_place: false,
        rating: null,
        review_count: null,
        content: [
          { title: '명동 길거리 음식 베스트', body: '명동은 한국에서 가장 유명한 길거리 음식 거리예요.' }
        ]
      },
      {
        category: 'Place',
        title: '하루만에 즐기는\n서울 고궁 투어',
        subtitle: '500년 왕조의 심장이 살아 숨쉬는 곳',
        description: '주요 도시의 관광명소부터 자연과 어우러지는 관광지까지.',
        bg_style: 'linear-gradient(160deg, #1a237e 0%, #3949ab 50%, #5c6bc0 100%)',
        is_place: true,
        rating: 4.7,
        review_count: 190,
        content: [
          { icon: '🏛', title: 'Gyeongbokgung · Seoul', body: '서울에서 가장 크고 원형이 잘 보존된 궁궐로, 1395년에 세워진 조선 왕궁의 으뜸이에요.', photoSpot: ['경회루 분수 옆', '경복궁 울관 돌담 앞 길'], travelTip: ['오픈 시간 하루 중 방문 추천', '서울 영어 투어 가이드 이용 가능'] },
          { icon: '🏛', title: 'Changdeokgung · Seoul', body: '창덕궁은 인조 이후 약 258년간 주된 왕정으로 사용된 유네스코 지정 세계문화유산이에요.', photoSpot: ['인정전 앞 마당', '후원 연꽃 연못'], travelTip: ['후원은 시간당 입장 인원 제한', '궁궐 야간 개장 확인 필수'] }
        ]
      }
    ]

    for (const a of articles) {
      await pool.query(
        `INSERT INTO articles (category, title, subtitle, description, bg_style, is_place, rating, review_count, content)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [a.category, a.title, a.subtitle, a.description, a.bg_style, a.is_place, a.rating, a.review_count, JSON.stringify(a.content)]
      )
    }
    console.log('[db] articles seeded')
  }

  // ATM seed
  const existingAtms = await pool.query('SELECT COUNT(*) FROM atm_locations')
  if (parseInt(existingAtms.rows[0].count) === 0) {
    const atms = [
      ['하나은행', '서울 종로구 종로 1가 58', '서울', 37.5699, 126.9844, '24시간'],
      ['신한은행', '서울 중구 명동길 14', '서울', 37.5634, 126.9844, '08:00-22:00'],
      ['KB국민은행', '서울 종로구 인사동길 12', '서울', 37.5745, 126.9847, '24시간'],
      ['우리은행', '서울 마포구 와우산로 29', '서울', 37.5560, 126.9240, '09:00-21:00'],
      ['하나은행', '부산 해운대구 해운대해변로 264', '부산', 35.1590, 129.1605, '24시간'],
      ['신한은행', '부산 중구 자갈치해안로 52', '부산', 35.0968, 129.0300, '08:00-20:00'],
      ['KB국민은행', '제주 제주시 중앙로 79', '제주', 33.5100, 126.5220, '24시간'],
      ['하나은행', '제주 서귀포시 중앙로 62', '제주', 33.2541, 126.5601, '09:00-21:00'],
      ['우리은행', '경북 경주시 원화로 281', '경주', 35.8562, 129.2247, '24시간'],
      ['신한은행', '인천 중구 차이나타운로 12', '인천', 37.4748, 126.6170, '08:00-22:00'],
    ]

    for (const [bank, address, city, lat, lng, hours] of atms) {
      await pool.query(
        `INSERT INTO atm_locations (bank, address, city, lat, lng, hours, accepts_foreign)
         VALUES ($1,$2,$3,$4,$5,$6,true)`,
        [bank, address, city, lat, lng, hours]
      )
    }
    console.log('[db] ATMs seeded')
  }
}

module.exports = { pool, initDb }
