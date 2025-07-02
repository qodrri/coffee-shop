// js/api.js - Add this file to integrate frontend with backend

const API_BASE_URL = window.location.origin; // Use same domain as frontend
// For development: const API_BASE_URL = 'http://localhost:3000';

class CoffeeShopAPI {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async makeRequest(endpoint, options = {}) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // Get coffee menu
  async getMenu() {
    return this.makeRequest('/api/menu');
  }

  // Get store information
  async getStoreInfo() {
    return this.makeRequest('/api/store-info');
  }

  // Subscribe to newsletter
  async subscribeNewsletter(email) {
    return this.makeRequest('/api/newsletter', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }

  // Submit contact form
  async submitContact(formData) {
    return this.makeRequest('/api/contact', {
      method: 'POST',
      body: JSON.stringify(formData)
    });
  }

  // Place order
  async placeOrder(orderData) {
    return this.makeRequest('/api/order', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
  }

  // Submit review
  async submitReview(reviewData) {
    return this.makeRequest('/api/reviews', {
      method: 'POST',
      body: JSON.stringify(reviewData)
    });
  }

  // Get reviews
  async getReviews() {
    return this.makeRequest('/api/reviews');
  }
}

// Initialize API
const coffeeAPI = new CoffeeShopAPI();

// Newsletter Form Handler
document.addEventListener('DOMContentLoaded', function() {
  // Newsletter subscription
  const newsletterForm = document.querySelector('#mc_embed_signup form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const emailInput = this.querySelector('input[name="EMAIL"]');
      const email = emailInput.value.trim();
      
      if (!email) {
        showNotification('Please enter your email address', 'error');
        return;
      }

      try {
        showLoading(true);
        await coffeeAPI.subscribeNewsletter(email);
        showNotification('Successfully subscribed to newsletter!', 'success');
        emailInput.value = '';
      } catch (error) {
        showNotification(error.message || 'Failed to subscribe', 'error');
      } finally {
        showLoading(false);
      }
    });
  }

  // Contact form (if exists)
  const contactForm = document.querySelector('#contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const formData = new FormData(this);
      const data = {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        message: formData.get('message')
      };

      try {
        showLoading(true);
        await coffeeAPI.submitContact(data);
        showNotification('Message sent successfully!', 'success');
        this.reset();
      } catch (error) {
        showNotification(error.message || 'Failed to send message', 'error');
      } finally {
        showLoading(false);
      }
    });
  }

  // Load dynamic content
  loadMenuFromAPI();
  loadReviewsFromAPI();
});

// Load menu from API
async function loadMenuFromAPI() {
  try {
    const response = await coffeeAPI.getMenu();
    const menuContainer = document.querySelector('#coffee .row');
    
    if (menuContainer && response.data) {
      // Clear existing menu items
      menuContainer.innerHTML = '';
      
      response.data.forEach(item => {
        const menuItem = createMenuItemHTML(item);
        menuContainer.appendChild(menuItem);
      });
    }
  } catch (error) {
    console.error('Failed to load menu:', error);
  }
}

// Create menu item HTML
function createMenuItemHTML(item) {
  const div = document.createElement('div');
  div.className = 'col-lg-4';
  div.innerHTML = `
    <div class="single-menu">
      <div class="title-div justify-content-between d-flex">
        <h4>${item.name}</h4>
        <p class="price float-right">$${item.price}</p>
      </div>
      <p>${item.description}</p>
      <button class="btn btn-primary btn-sm mt-2" onclick="addToOrder(${item.id}, '${item.name}', ${item.price})">
        Add to Order
      </button>
    </div>
  `;
  return div;
}

// Load reviews from API
async function loadReviewsFromAPI() {
  try {
    const response = await coffeeAPI.getReviews();
    const reviewContainer = document.querySelector('#review .row');
    
    if (reviewContainer && response.data && response.data.length > 0) {
      // Update with real reviews
      updateReviewsHTML(response.data);
    }
  } catch (error) {
    console.error('Failed to load reviews:', error);
  }
}

// Shopping cart functionality
let cart = [];

function addToOrder(id, name, price) {
  const existingItem = cart.find(item => item.id === id);
  
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      id: id,
      name: name,
      price: price,
      quantity: 1
    });
  }
  
  updateCartDisplay();
  showNotification(`${name} added to cart!`, 'success');
}

function updateCartDisplay() {
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  
  // Update cart icon if exists
  const cartIcon = document.querySelector('.cart-count');
  if (cartIcon) {
    cartIcon.textContent = cartCount;
  }
  
  // Update cart modal if exists
  const cartModal = document.querySelector('#cart-modal');
  if (cartModal) {
    updateCartModal();
  }
}

function updateCartModal() {
  const cartItems = document.querySelector('#cart-items');
  const cartTotal = document.querySelector('#cart-total');
  
  if (cartItems) {
    cartItems.innerHTML = '';
    
    cart.forEach(item => {
      const itemHTML = `
        <div class="cart-item d-flex justify-content-between align-items-center mb-2">
          <div>
            <h6>${item.name}</h6>
            <small>$${item.price} x ${item.quantity}</small>
          </div>
          <div>
            <span>$${(item.price * item.quantity).toFixed(2)}</span>
            <button class="btn btn-sm btn-danger ml-2" onclick="removeFromCart(${item.id})">×</button>
          </div>
        </div>
      `;
      cartItems.innerHTML += itemHTML;
    });
  }
  
  if (cartTotal) {
    const total = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    cartTotal.textContent = `${total.toFixed(2)}`;
  }
}

function removeFromCart(id) {
  cart = cart.filter(item => item.id !== id);
  updateCartDisplay();
  showNotification('Item removed from cart', 'info');
}

function clearCart() {
  cart = [];
  updateCartDisplay();
  showNotification('Cart cleared', 'info');
}

// Checkout functionality
async function checkout() {
  if (cart.length === 0) {
    showNotification('Cart is empty', 'error');
    return;
  }

  const customerName = prompt('Enter your name:');
  const customerEmail = prompt('Enter your email:');
  const customerPhone = prompt('Enter your phone (optional):');

  if (!customerName || !customerEmail) {
    showNotification('Name and email are required', 'error');
    return;
  }

  const orderData = {
    customerName,
    email: customerEmail,
    phone: customerPhone,
    items: cart,
    total: cart.reduce((total, item) => total + (item.price * item.quantity), 0),
    notes: ''
  };

  try {
    showLoading(true);
    const response = await coffeeAPI.placeOrder(orderData);
    showNotification(`Order placed successfully! Order ID: ${response.data.id}`, 'success');
    clearCart();
    
    // Close cart modal if exists
    const cartModal = document.querySelector('#cart-modal');
    if (cartModal && cartModal.style.display === 'block') {
      cartModal.style.display = 'none';
    }
  } catch (error) {
    showNotification(error.message || 'Failed to place order', 'error');
  } finally {
    showLoading(false);
  }
}

// Review submission
function submitReview() {
  const name = prompt('Enter your name:');
  const email = prompt('Enter your email:');
  const rating = prompt('Rate us (1-5 stars):');
  const comment = prompt('Your review:');

  if (!name || !rating || !comment) {
    showNotification('Name, rating, and comment are required', 'error');
    return;
  }

  const reviewData = {
    name,
    email,
    rating: parseInt(rating),
    comment
  };

  coffeeAPI.submitReview(reviewData)
    .then(response => {
      showNotification('Review submitted successfully! It will be reviewed before publishing.', 'success');
    })
    .catch(error => {
      showNotification(error.message || 'Failed to submit review', 'error');
    });
}

// Utility functions
function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <span>${message}</span>
      <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
    </div>
  `;
  
  // Add styles if not already added
  if (!document.querySelector('#notification-styles')) {
    const styles = document.createElement('style');
    styles.id = 'notification-styles';
    styles.textContent = `
      .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        min-width: 300px;
        max-width: 500px;
        padding: 15px;
        border-radius: 5px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        animation: slideIn 0.3s ease-out;
      }
      
      .notification-success {
        background-color: #d4edda;
        color: #155724;
        border: 1px solid #c3e6cb;
      }
      
      .notification-error {
        background-color: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
      }
      
      .notification-info {
        background-color: #d1ecf1;
        color: #0c5460;
        border: 1px solid #bee5eb;
      }
      
      .notification-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .notification-close {
        background: none;
        border: none;
        font-size: 18px;
        cursor: pointer;
        padding: 0;
        margin-left: 10px;
      }
      
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      .loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
      }
      
      .loading-spinner {
        width: 50px;
        height: 50px;
        border: 5px solid #f3f3f3;
        border-top: 5px solid #333;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(styles);
  }
  
  document.body.appendChild(notification);
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 5000);
}

function showLoading(show) {
  const existingOverlay = document.querySelector('.loading-overlay');
  
  if (show) {
    if (!existingOverlay) {
      const overlay = document.createElement('div');
      overlay.className = 'loading-overlay';
      overlay.innerHTML = '<div class="loading-spinner"></div>';
      document.body.appendChild(overlay);
    }
  } else {
    if (existingOverlay) {
      existingOverlay.remove();
    }
  }
}

// Cart modal HTML (add this to your HTML files)
function createCartModal() {
  const modalHTML = `
    <div id="cart-modal" class="modal" style="display: none;">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Your Order</h3>
          <span class="close" onclick="closeCartModal()">&times;</span>
        </div>
        <div class="modal-body">
          <div id="cart-items"></div>
          <hr>
          <div class="cart-total">
            <strong>Total: <span id="cart-total">$0.00</span></strong>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="clearCart()">Clear Cart</button>
          <button class="btn btn-primary" onclick="checkout()">Checkout</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function openCartModal() {
  const modal = document.querySelector('#cart-modal');
  if (!modal) {
    createCartModal();
  }
  document.querySelector('#cart-modal').style.display = 'block';
  updateCartModal();
}

function closeCartModal() {
  document.querySelector('#cart-modal').style.display = 'none';
}

// Initialize cart icon and modal
document.addEventListener('DOMContentLoaded', function() {
  // Add cart icon to header if it doesn't exist
  const header = document.querySelector('header .nav-menu');
  if (header && !document.querySelector('.cart-icon')) {
    const cartItem = document.createElement('li');
    cartItem.innerHTML = `
      <a href="#" onclick="openCartModal(); return false;" class="cart-icon">
        Cart (<span class="cart-count">0</span>)
      </a>
    `;
    header.appendChild(cartItem);
  }
  
  // Add modal styles
  if (!document.querySelector('#modal-styles')) {
    const modalStyles = document.createElement('style');
    modalStyles.id = 'modal-styles';
    modalStyles.textContent = `
      .modal {
        position: fixed;
        z-index: 1000;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0,0,0,0.4);
      }
      
      .modal-content {
        background-color: #fefefe;
        margin: 5% auto;
        padding: 0;
        border: 1px solid #888;
        width: 90%;
        max-width: 600px;
        border-radius: 5px;
      }
      
      .modal-header {
        padding: 20px;
        background-color: #f8f9fa;
        border-bottom: 1px solid #dee2e6;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .modal-body {
        padding: 20px;
      }
      
      .modal-footer {
        padding: 20px;
        background-color: #f8f9fa;
        border-top: 1px solid #dee2e6;
        text-align: right;
      }
      
      .close {
        color: #aaa;
        font-size: 28px;
        font-weight: bold;
        cursor: pointer;
      }
      
      .close:hover {
        color: black;
      }
      
      .cart-item {
        padding: 10px 0;
        border-bottom: 1px solid #eee;
      }
      
      .cart-total {
        text-align: right;
        font-size: 18px;
        margin-top: 10px;
      }
    `;
    document.head.appendChild(modalStyles);
  }
});

// Enhanced Buy Now button functionality
document.addEventListener('DOMContentLoaded', function() {
  const buyNowBtn = document.querySelector('.primary-btn');
  if (buyNowBtn && buyNowBtn.textContent.includes('Buy Now')) {
    buyNowBtn.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Scroll to menu section
      const menuSection = document.querySelector('#coffee');
      if (menuSection) {
        menuSection.scrollIntoView({ behavior: 'smooth' });
        showNotification('Choose your favorite coffee below!', 'info');
      } else {
        openCartModal();
      }
    });
  }
});

// Add review button functionality
document.addEventListener('DOMContentLoaded', function() {
  const reviewSection = document.querySelector('#review');
  if (reviewSection) {
    const addReviewBtn = document.createElement('button');
    addReviewBtn.className = 'btn btn-primary mt-3';
    addReviewBtn.textContent = 'Write a Review';
    addReviewBtn.onclick = submitReview;
    
    const titleDiv = reviewSection.querySelector('.title');
    if (titleDiv) {
      titleDiv.appendChild(addReviewBtn);
    }
  }
});

// Smooth scrolling for navigation
document.addEventListener('DOMContentLoaded', function() {
  const navLinks = document.querySelectorAll('.nav-menu a[href^="#"]');
  
  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      
      const targetId = this.getAttribute('href');
      const targetSection = document.querySelector(targetId);
      
      if (targetSection) {
        targetSection.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
});

// Update store hours dynamically
document.addEventListener('DOMContentLoaded', async function() {
  try {
    const storeInfo = await coffeeAPI.getStoreInfo();
    const headerTopRight = document.querySelector('.header-top-right ul');
    
    if (headerTopRight && storeInfo.data) {
      headerTopRight.innerHTML = `
        <li>${storeInfo.data.weekdays}</li>
        <li>${storeInfo.data.weekends}</li>
        <li><a href="tel:${storeInfo.data.phone}">${storeInfo.data.phone}</a></li>
      `;
    }
  } catch (error) {
    console.error('Failed to load store info:', error);
  }
});