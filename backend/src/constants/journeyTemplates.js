const journeyTemplates = [
  {
    name: 'User Login',
    description: 'A standard user login flow: navigate to the login page, fill in credentials, and submit.',
    steps: [
      { action: 'navigate', value: '/login' },
      { action: 'type', selector: '#email', value: 'test@example.com' },
      { action: 'type', selector: '#password', value: 'password123' },
      { action: 'click', selector: 'button[type="submit"]' },
      { action: 'waitForNavigation' }
    ]
  },
  {
    name: 'User Registration',
    description: 'A standard user registration flow: navigate to the register page, fill in details, and submit.',
    steps: [
      { action: 'navigate', value: '/register' },
      { action: 'type', selector: '#username', value: 'newuser' },
      { action: 'type', selector: '#email', value: 'newuser@example.com' },
      { action: 'type', selector: '#password', value: 'password123' },
      { action: 'click', selector: 'button[type="submit"]' },
      { action: 'waitForNavigation' }
    ]
  },
  {
    name: 'Password Reset',
    description: 'A standard password reset flow: navigate to the forgot password page, enter email, and submit.',
    steps: [
      { action: 'navigate', value: '/forgot-password' },
      { action: 'type', selector: '#email', value: 'test@example.com' },
      { action: 'click', selector: 'button[type="submit"]' },
      { action: 'waitForNavigation' }
    ]
  },
  {
    name: 'E-commerce Checkout',
    description: 'A standard e-commerce checkout flow: add an item to the cart, go to checkout, and complete the purchase.',
    steps: [
      { action: 'navigate', value: '/products' },
      { action: 'click', selector: '.add-to-cart-button' },
      { action: 'navigate', value: '/cart' },
      { action: 'click', selector: '#checkout-button' },
      { action: 'waitForNavigation' }
    ]
  },
  {
    name: 'Search Functionality',
    description: 'A standard search flow: navigate to the home page, enter a search query, and submit.',
    steps: [
      { action: 'navigate', value: '/' },
      { action: 'type', selector: '#search-input', value: 'test query' },
      { action: 'click', selector: '#search-button' },
      { action: 'waitForNavigation' }
    ]
  },
  {
    name: 'Contact Form Submission',
    description: 'A standard contact form submission flow: navigate to the contact page, fill in the form, and submit.',
    steps: [
      { action: 'navigate', value: '/contact' },
      { action: 'type', selector: '#name', value: 'John Doe' },
      { action: 'type', selector: '#email', value: 'john.doe@example.com' },
      { action: 'type', selector: '#message', value: 'This is a test message.' },
      { action: 'click', selector: 'button[type="submit"]' },
      { action: 'waitForNavigation' }
    ]
  },
  {
    name: 'User Profile Update',
    description: 'A standard user profile update flow: navigate to the profile page, update information, and save.',
    steps: [
      { action: 'navigate', value: '/profile' },
      { action: 'type', selector: '#username', value: 'new-username' },
      { action: 'click', selector: 'button[type="submit"]' },
      { action: 'waitForNavigation' }
    ]
  },
  {
    name: 'Newsletter Subscription',
    description: 'A standard newsletter subscription flow: find the subscription form, enter an email, and subscribe.',
    steps: [
      { action: 'type', selector: '#newsletter-email', value: 'subscriber@example.com' },
      { action: 'click', selector: '#newsletter-subscribe-button' },
      { action: 'waitForText', value: 'Thank you for subscribing!' }
    ]
  },
  {
    name: 'API Health Check',
    description: 'A simple API health check: make a GET request to a health check endpoint and expect a 200 OK response.',
    steps: [
      { action: 'request', method: 'GET', url: '/api/health', expects: { status: 200 } }
    ]
  },
  {
    name: 'Broken Link Checker',
    description: 'A journey to crawl a page and check for broken links (404s).',
    steps: [
      { action: 'navigate', value: '/' },
      { action: 'checkLinks' }
    ]
  }
];

module.exports = journeyTemplates;
