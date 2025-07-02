// server.js
const express = require("express");
const cors = require("cors");
const path = require("path");
const nodemailer = require("nodemailer");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Database
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// Data storage (in production, use a database)
let orders = [];
let newsletters = [];
let reviews = [];

// Coffee menu data
const coffeeMenu = [
  {
    id: 1,
    name: "Cappuccino",
    price: 49,
    description: "Perfect blend of espresso, steamed milk, and milk foam",
  },
  {
    id: 2,
    name: "Americano",
    price: 49,
    description: "Rich espresso shots with hot water for a bold flavor",
  },
  {
    id: 3,
    name: "Espresso",
    price: 49,
    description: "Pure, concentrated coffee shot for true coffee lovers",
  },
  {
    id: 4,
    name: "Macchiato",
    price: 49,
    description: "Espresso marked with a dollop of steamed milk foam",
  },
  {
    id: 5,
    name: "Mocha",
    price: 49,
    description: "Delicious combination of espresso, chocolate, and steamed milk",
  },
  {
    id: 6,
    name: "Coffee Latte",
    price: 49,
    description: "Smooth espresso with steamed milk and light foam",
  },
  {
    id: 7,
    name: "Piccolo Latte",
    price: 49,
    description: "Small but strong latte with perfect milk to coffee ratio",
  },
  {
    id: 8,
    name: "Ristretto",
    price: 49,
    description: "Short shot of espresso with intense flavor",
  },
  {
    id: 9,
    name: "Affogato",
    price: 49,
    description: "Vanilla ice cream drowned in a shot of hot espresso",
  },
];

// Store hours
const storeHours = {
  weekdays: "Mon-Fri: 8am to 2pm",
  weekends: "Sat-Sun: 11am to 4pm",
  phone: "(012) 6985 236 7512",
};

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Routes

// Serve static HTML files
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/generic", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "generic.html"));
});

app.get("/elements", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "elements.html"));
});

// API Routes

// Get coffee menu
app.get("/api/menu", (req, res) => {
  res.json({
    success: true,
    data: coffeeMenu,
  });
});

// Get store information
app.get("/api/store-info", (req, res) => {
  res.json({
    success: true,
    data: storeHours,
  });
});

// Newsletter subscription
app.post("/api/newsletter", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.includes("@")) {
      return res.status(400).json({
        success: false,
        message: "Valid email address is required",
      });
    }

    // Check if email already exists
    const existingSubscription = newsletters.find((sub) => sub.email === email);
    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        message: "Email already subscribed to newsletter",
      });
    }

    // Add to newsletter list
    const subscription = {
      id: newsletters.length + 1,
      email: email,
      subscribedAt: new Date().toISOString(),
    };

    newsletters.push(subscription);

    // Send welcome email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Welcome to Coffee Shop Newsletter!",
      html: `
        <h2>Welcome to our Coffee Family!</h2>
        <p>Thank you for subscribing to our newsletter. You'll receive updates about:</p>
        <ul>
          <li>New coffee blends and seasonal specials</li>
          <li>Exclusive discounts and promotions</li>
          <li>Coffee brewing tips and recipes</li>
          <li>Store events and news</li>
        </ul>
        <p>Visit us at our coffee shop!</p>
        <p><strong>Hours:</strong><br>
        Mon-Fri: 8am to 2pm<br>
        Sat-Sun: 11am to 4pm</p>
        <p><strong>Phone:</strong> (012) 6985 236 7512</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.json({
      success: true,
      message: "Successfully subscribed to newsletter",
      data: subscription,
    });
  } catch (error) {
    console.error("Newsletter subscription error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to subscribe to newsletter",
    });
  }
});

// Contact form submission
app.post("/api/contact", async (req, res) => {
  try {
    const { name, email, message, phone } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and message are required",
      });
    }

    // Send contact email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.CONTACT_EMAIL || process.env.EMAIL_USER,
      subject: `New Contact Form Submission from ${name}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || "Not provided"}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
        <hr>
        <p><em>Sent from Coffee Shop website contact form</em></p>
      `,
    };

    await transporter.sendMail(mailOptions);

    // Auto-reply to customer
    const autoReplyOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Thank you for contacting Coffee Shop",
      html: `
        <h2>Thank you for your message!</h2>
        <p>Dear ${name},</p>
        <p>We have received your message and will get back to you within 24 hours.</p>
        <p>Your message:</p>
        <blockquote>${message}</blockquote>
        <p>Best regards,<br>Coffee Shop Team</p>
      `,
    };

    await transporter.sendMail(autoReplyOptions);

    res.json({
      success: true,
      message: "Message sent successfully",
    });
  } catch (error) {
    console.error("Contact form error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send message",
    });
  }
});

// Place order
app.post("/api/order", (req, res) => {
  try {
    const { customerName, email, phone, items, total, notes } = req.body;

    if (!customerName || !email || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Customer name, email, and items are required",
      });
    }

    const order = {
      id: orders.length + 1,
      customerName,
      email,
      phone,
      items,
      total: total || items.reduce((sum, item) => sum + item.price * item.quantity, 0),
      notes: notes || "",
      status: "pending",
      orderDate: new Date().toISOString(),
    };

    orders.push(order);

    res.json({
      success: true,
      message: "Order placed successfully",
      data: order,
    });
  } catch (error) {
    console.error("Order placement error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to place order",
    });
  }
});

// Get orders (admin endpoint)
app.get("/api/orders", (req, res) => {
  res.json({
    success: true,
    data: orders,
  });
});

// Update order status (admin endpoint)
app.put("/api/orders/:id", (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const { status } = req.body;

    const orderIndex = orders.findIndex((order) => order.id === orderId);
    if (orderIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    orders[orderIndex].status = status;
    orders[orderIndex].updatedAt = new Date().toISOString();

    res.json({
      success: true,
      message: "Order status updated",
      data: orders[orderIndex],
    });
  } catch (error) {
    console.error("Order update error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update order",
    });
  }
});

// Submit review
app.post("/api/reviews", (req, res) => {
  try {
    const { name, email, rating, comment } = req.body;

    if (!name || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: "Name, rating, and comment are required",
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    const review = {
      id: reviews.length + 1,
      name,
      email,
      rating,
      comment,
      approved: false,
      createdAt: new Date().toISOString(),
    };

    reviews.push(review);

    res.json({
      success: true,
      message: "Review submitted successfully",
      data: review,
    });
  } catch (error) {
    console.error("Review submission error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit review",
    });
  }
});

// Get approved reviews
app.get("/api/reviews", (req, res) => {
  const approvedReviews = reviews.filter((review) => review.approved);
  res.json({
    success: true,
    data: approvedReviews,
  });
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Something went wrong!",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint not found",
  });
});

app.listen(PORT, () => {
  console.log(`Coffee Shop server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});
