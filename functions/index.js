const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');

admin.initializeApp();
const db = admin.firestore();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// API Routes
app.get('/api/safras', async (req, res) => {
  try {
    const snapshot = await db.collection('safras').get();
    const safras = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(safras);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/safras', async (req, res) => {
  try {
    const safra = req.body;
    const docRef = await db.collection('safras').add({
      ...safra,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    res.json({ id: docRef.id, ...safra });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/accounts', async (req, res) => {
  try {
    const snapshot = await db.collection('accounts').get();
    const accounts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/accounts', async (req, res) => {
  try {
    const account = req.body;
    const docRef = await db.collection('accounts').add({
      ...account,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    res.json({ id: docRef.id, ...account });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/expenses', async (req, res) => {
  try {
    const snapshot = await db.collection('expenses').get();
    const expenses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/expenses', async (req, res) => {
  try {
    const expense = req.body;
    const docRef = await db.collection('expenses').add({
      ...expense,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    res.json({ id: docRef.id, ...expense });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/revenues', async (req, res) => {
  try {
    const snapshot = await db.collection('revenues').get();
    const revenues = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(revenues);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/revenues', async (req, res) => {
  try {
    const revenue = req.body;
    const docRef = await db.collection('revenues').add({
      ...revenue,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    res.json({ id: docRef.id, ...revenue });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

exports.api = functions.https.onRequest(app);

