module.exports = `
    /* =========================================================================
       1. CONSTANTS, THEME PALETTES & 12 OBS FRAME DEFINITIONS
       ========================================================================= */
    const STORAGE_KEY = 'bcc_cg_pro_v4';
    const CHANNEL_NAME = 'bcc_cg_pro_bus_v4';

    const THEME_PALETTES = {
      'bcc-crimson': {
        bgStart: '#181416', bgEnd: '#0d0b0c',
        surface: '#1f1b1d', accent: '#b91c1c', accentSoft: 'rgba(185,28,28,0.38)',
        border: 'rgba(255,255,255,0.14)', text: '#fafafa'
      },
      'bcc-light': {
        bgStart: '#f5f3ee', bgEnd: '#e6e2d8',
        surface: '#ffffff', accent: '#991b1b', accentSoft: 'rgba(153,27,27,0.35)',
        border: 'rgba(17,17,19,0.14)', text: '#111113'
      },
      'classic-gold': {
        bgStart: '#151518', bgEnd: '#0b0b0d',
        surface: '#1b1a1d', accent: '#c8a96b', accentSoft: 'rgba(200,169,107,0.42)',
        border: 'rgba(245,241,232,0.14)', text: '#f5f1e8'
      },
      'navy': {
        bgStart: '#0e1828', bgEnd: '#070d17',
        surface: '#131e30', accent: '#d97706', accentSoft: 'rgba(217,119,6,0.42)',
        border: 'rgba(248,250,252,0.14)', text: '#f8fafc'
      }
    };

    // 12 Professional OBS Frame Definitions (1920x1080 transparent cutouts)
    // Note: Frames with sidebars (cam-bible, cam-announce, welcome-cam, cam-slides, pastor-info, prayer)
    // all share the EXACT same primary window: 1216x684 @ (48, 148) with radius 14!
    const FRAME_DEFS = [
      {
        id: 'main-cam',
        name: 'Main Camera',
        short: 'Full 16:9 cinematic camera border',
        hint: 'Full Cam: 1872×1032 @ (24,24)',
        cutouts: [{ x: 24, y: 24, w: 1872, h: 1032, r: 16, label: 'MAIN CAMERA (16:9)' }]
      },
      {
        id: 'cam-bible',
        name: 'Camera + Bible Verse',
        short: '16:9 Cam + Scripture card',
        hint: 'Primary: 1216×684 @ (48,148)',
        cutouts: [{ x: 48, y: 148, w: 1216, h: 684, r: 14, label: 'MAIN CAMERA (1216×684)' }]
      },
      {
        id: 'cam-announce',
        name: 'Camera + Announcements',
        short: '16:9 Cam + News panel right',
        hint: 'Primary: 1216×684 @ (48,148)',
        cutouts: [{ x: 48, y: 148, w: 1216, h: 684, r: 14, label: 'MAIN CAMERA (1216×684)' }]
      },
      {
        id: 'welcome-cam',
        name: 'Starting Soon & Cam',
        short: 'Sanctuary Cam + Countdown',
        hint: 'Primary: 1216×684 @ (48,148)',
        cutouts: [{ x: 48, y: 148, w: 1216, h: 684, r: 14, label: 'SANCTUARY CAMERA (1216×684)' }]
      },
      {
        id: 'cam-slides',
        name: 'Camera + Slideshow',
        short: 'Slides left + Speaker PiP right',
        hint: 'Slides: 1216×684 @ (48,148) • PiP: 576×324 @ (1296,148)',
        cutouts: [
          { x: 48, y: 148, w: 1216, h: 684, r: 14, label: 'SLIDESHOW / LYRICS (1216×684)' },
          { x: 1296, y: 148, w: 576, h: 324, r: 14, label: 'SPEAKER PiP (576×324)' }
        ]
      },
      {
        id: 'pastor-info',
        name: 'Pastor & Sermon',
        short: 'Camera + Pastor profile card',
        hint: 'Primary: 1216×684 @ (48,148)',
        cutouts: [{ x: 48, y: 148, w: 1216, h: 684, r: 14, label: 'PASTOR CAMERA (1216×684)' }]
      },
      {
        id: 'worship',
        name: 'Worship Service',
        short: 'Wide Cam + Song & Hymn footer',
        hint: 'Wide Cam: 1824×788 @ (48,36)',
        cutouts: [{ x: 48, y: 36, w: 1824, h: 788, r: 14, label: 'WORSHIP CAMERA (FULL WIDTH)' }]
      },
      {
        id: 'prayer',
        name: 'Prayer Session',
        short: 'Camera + Prayer petition card',
        hint: 'Primary: 1216×684 @ (48,148)',
        cutouts: [{ x: 48, y: 148, w: 1216, h: 684, r: 14, label: 'SANCTUARY CAMERA (1216×684)' }]
      },
      {
        id: 'cam-pip',
        name: 'Camera PiP Corner',
        short: 'Wide camera with corner inset',
        hint: 'Wide: 1600×900 @ 24,24 • PiP: 384×216 @ 1512,840',
        cutouts: [
          { x: 24, y: 24, w: 1600, h: 900, r: 16, label: 'WIDE CAMERA' },
          { x: 1512, y: 840, w: 384, h: 216, r: 12, label: 'INSET PiP' }
        ]
      },
      {
        id: 'interview',
        name: 'Two-Camera Split',
        short: 'Two equal side-by-side feeds',
        hint: 'Cam 1: 912×684 @ 48,148 • Cam 2: 912×684 @ 960,148',
        cutouts: [
          { x: 48, y: 148, w: 912, h: 684, r: 14, label: 'CAMERA 1 (HOST)' },
          { x: 960, y: 148, w: 912, h: 684, r: 14, label: 'CAMERA 2 (GUEST)' }
        ]
      },
      {
        id: 'event-announce',
        name: 'Church Event Cards',
        short: 'Wide Cam + 3 event bulletins below',
        hint: 'Wide Cam: 1824×620 @ (48,36)',
        cutouts: [{ x: 48, y: 36, w: 1824, h: 620, r: 14, label: 'STAGE CAMERA (1824×620)' }]
      },
      {
        id: 'countdown-closing',
        name: 'Benediction & Closing',
        short: 'Post-service closing & next schedule',
        hint: 'Closing Graphic (No camera cutout)',
        cutouts: []
      }
    ];

    const FRAME_BASE_DEFAULTS = {
      theme: 'inherit',
      customAccent: '',
      cornerRadius: 14,
      borderWidth: 3,
      textScale: 1.0,
      matteOpacity: 1.0,
      mirror: false,
      showHeader: true,
      showInfoBar: true,
      showLive: true,
      showLogo: true,
      showLowerThirdInFrame: true,
      showMarqueeInFrame: false
    };

    const FRAME_SPECIFIC_DEFAULTS = {
      'main-cam':          { cornerRadius: 16, headerBadge: 'LIVE',                 panelTitle: '' },
      'cam-bible':         { cornerRadius: 14, headerBadge: 'SCRIPTURE READING',    panelTitle: 'HOLY BIBLE' },
      'cam-announce':      { cornerRadius: 14, headerBadge: 'CHURCH ANNOUNCEMENTS', panelTitle: 'Church News' },
      'welcome-cam':       { cornerRadius: 14, headerBadge: 'STARTING SOON',        panelTitle: 'SERVICE BEGINS IN' },
      'cam-slides':        { cornerRadius: 14, headerBadge: 'SERMON SLIDES',        panelTitle: 'LIVE SPEAKER' },
      'pastor-info':       { cornerRadius: 14, headerBadge: 'SUNDAY MESSAGE',       panelTitle: 'SENIOR PASTOR' },
      'worship':           { cornerRadius: 14, headerBadge: 'WORSHIP & PRAISE',     panelTitle: 'SONG TITLE' },
      'prayer':            { cornerRadius: 14, headerBadge: 'INTERCESSORY PRAYER',  panelTitle: 'PRAYER REQUESTS' },
      'cam-pip':           { cornerRadius: 16, headerBadge: 'LIVE BROADCAST',       panelTitle: 'SANCTUARY' },
      'interview':         { cornerRadius: 14, headerBadge: 'CONVERSATION & DIALOGUE', panelTitle: 'INTERVIEW' },
      'event-announce':    { cornerRadius: 14, headerBadge: 'UPCOMING EVENTS',      panelTitle: 'CHURCH CALENDAR' },
      'countdown-closing': { cornerRadius: 14, headerBadge: 'CLOSING BENEDICTION',  panelTitle: 'GO IN PEACE' }
    };

    const PRESETS = {
      speaker: {
        key: '1', label: 'Speaker', category: 'SPEAKER',
        primary: 'Pastor John Smith', secondary: 'Senior Pastor', badge: 'JOHN 14:6',
        pLabel: 'Speaker Name', sLabel: 'Title / Role'
      },
      sermon: {
        key: '2', label: 'Sermon', category: "TODAY'S MESSAGE",
        primary: 'Walking by Faith', secondary: 'Pastor John Smith • Sunday Service', badge: 'PART 1',
        pLabel: 'Sermon Title', sLabel: 'Speaker / Series'
      },
      scripture: {
        key: '3', label: 'Scripture', category: 'SCRIPTURE READING',
        primary: '“I am the way and the truth and the life. No one comes to the Father except through me.”',
        secondary: 'John 14:6 (NIV)', badge: '',
        pLabel: 'Bible Verse', sLabel: 'Reference'
      },
      announcement: {
        key: '4', label: 'Notice', category: 'ANNOUNCEMENT',
        primary: 'Sunday Worship Service', secondary: 'Every Sunday at 10:00 AM • Bangkok Christ Church', badge: 'WELCOME',
        pLabel: 'Headline', sLabel: 'Date, Time & Location'
      }
    };

    const DEFAULT_CONFIG = {
      mode: 'speaker',
      animStyle: 'modern-slide', // 'modern-slide' | 'minimal-fade' | 'elegant-reveal' | 'classic-bar'
      category: 'SPEAKER',
      churchName: 'Bangkok Christ Church',
      primary: 'Pastor John Smith',
      secondary: 'Senior Pastor',
      badge: 'JOHN 14:6',
      theme: 'bcc-crimson',
      bgOpacity: 0.94,
      showLogo: true,
      customLogo: '',
      showLive: true,
      showTicker: false,
      tickerPaused: false,
      marqueeTag: 'CHURCH NEWS',
      marqueeSpeed: 32,
      marqueeText: 'Welcome to Bangkok Christ Church (John 14:6) | Sunday Worship Service at 10:00 AM | Wednesday Prayer & Bible Study at 7:00 PM | Follow us online at bcc.church',
      scale: 1.0,
      autoHide: false,
      durationSec: 10,

      // Ready-Made OBS Frame Content
      frameVerseRef: 'John 14:6',
      frameVerseVer: 'NIV',
      frameVerseText: 'Jesus answered, “I am the way and the truth and the life. No one comes to the Father except through me.”',
      
      // Structured Announcements List (two fields per line: title & details)
      frameAnnouncementsList: [
        { title: 'Sunday Worship Service', details: 'Every Sunday at 10:00 AM • Sanctuary & Online' },
        { title: 'Wednesday Prayer & Bible Study', details: 'Every Wednesday at 7:00 PM • Fellowship Hall' },
        { title: 'Youth & Young Adults Fellowship', details: 'Fridays at 6:30 PM • Welcome Center' },
        { title: 'Online Tithes & Offerings', details: 'Transfer via PromptPay or visit bcc.church/give' }
      ],
      frameAnnouncements: '', // legacy mirror string

      frameSlideTag: 'SERMON SLIDES',
      frameWelcomeTitle: 'Sunday Worship Service',
      frameWelcomeSub: 'We are glad you are worshiping with us today • Bangkok Christ Church',
      frameSongTitle: 'Amazing Grace (My Chains Are Gone)',
      frameSongDetails: 'Worship Team • Key of G • 4/4 Time',
      framePrayerTitle: 'Prayer for Our Community and Nation',
      framePrayerDetails: 'Lord, grant wisdom, peace, and healing to all families and leaders.',
      frameInterviewHost: 'Pastor John Smith | Host',
      frameInterviewGuest: 'Dr. David Lee | Visiting Missionary',
      
      countdownMode: 'duration',
      countdownTargetTime: '10:00',
      countdownMinutes: 5,
      countdownRemainingSec: 300,
      countdownRunning: false,
      countdownEndTs: 0,

      frameSettings: {}
    };

    const DEFAULT_CUES = [
      { id: 'c1', mode: 'speaker', category: 'SENIOR PASTOR', primary: 'Pastor John Smith', secondary: 'Senior Pastor • Bangkok Christ Church', badge: 'JOHN 14:6', duration: 10 },
      { id: 'c2', mode: 'sermon', category: "TODAY'S MESSAGE", primary: 'Walking by Faith, Not by Sight', secondary: 'Sermon Series: Unshakable Kingdom', badge: 'HEBREWS 11:1', duration: 15 },
      { id: 'c3', mode: 'scripture', category: 'SCRIPTURE READING', primary: '“I am the way and the truth and the life. No one comes to the Father except through me.”', secondary: 'John 14:6 (NIV)', badge: '', duration: 20 },
      { id: 'c4', mode: 'speaker', category: 'GUEST SPEAKER', primary: 'Rev. Timothy Vance', secondary: 'Global Mission Director', badge: 'GUEST', duration: 10 },
      { id: 'c5', mode: 'speaker', category: 'WORSHIP LEADER', primary: 'Sarah & BCC Worship Team', secondary: 'Praise & Adoration', badge: 'PSALM 100', duration: 12 },
      { id: 'c6', mode: 'announcement', category: 'ANNOUNCEMENT', primary: 'Wednesday Prayer Meeting', secondary: 'Every Wednesday at 7:00 PM • Fellowship Hall & Zoom', badge: 'JOIN US', duration: 15 },
      { id: 'c7', mode: 'announcement', category: 'WELCOME', primary: 'First Time Visiting?', secondary: 'Please scan the QR code in the lobby for our Welcome Gift!', badge: 'WELCOME', duration: 15 },
      { id: 'c8', mode: 'speaker', category: 'BENEDICTION', primary: 'The Lord Bless You and Keep You', secondary: 'Numbers 6:24-26 • Go in His Peace', badge: 'AMEN', duration: 15 }
    ];

    const DEFAULT_MARQUEE_PRESETS = [
      {
        id: 'mq1',
        name: 'Sunday Service & Welcome',
        tag: 'CHURCH NEWS',
        speed: 32,
        text: 'Welcome to Bangkok Christ Church • John 14:6 | Sunday Worship Service at 10:00 AM | Children Sunday School in Room 204'
      },
      {
        id: 'mq2',
        name: 'Weekly Schedule & Prayer',
        tag: 'WEEKLY EVENTS',
        speed: 30,
        text: 'Wednesday Prayer Meeting at 7:00 PM | Friday Youth Fellowship at 6:30 PM | Saturday Choir Rehearsal at 4:00 PM'
      },
      {
        id: 'mq3',
        name: 'Giving & Tithes',
        tag: 'GIVING & TITHES',
        speed: 35,
        text: 'Support the Lord’s work: Bangkok Bank A/C 123-4-56789-0 • Bangkok Christ Church | PromptPay QR available at welcome desk'
      },
      {
        id: 'mq4',
        name: 'Prayer Requests & Pastoral Care',
        tag: 'PRAYER LINE',
        speed: 28,
        text: 'Need prayer or counseling? Contact our pastoral team: prayer@bcc.church or call 02-123-4567 | God bless you'
      }
    ];
`;
