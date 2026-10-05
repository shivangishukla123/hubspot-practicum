require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Setup Pug Template Engine
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Middleware to parse incoming request data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Target object (using contacts to ensure permissions work seamlessly)
const CUSTOM_OBJECT_TYPE = 'contacts';

// Axios Headers configuration
const hubspotHeaders = {
    headers: {
        Authorization: `Bearer ${process.env.PRIVATE_APP_ACCESS_TOKEN ? process.env.PRIVATE_APP_ACCESS_TOKEN.trim() : ''}`,
        'Content-Type': 'application/json'
    }
};

// STEP 11 — GET / Route (Homepage)
app.get('/', async (req, res) => {
    const url = `https://api.hubapi.com/crm/v3/objects/${CUSTOM_OBJECT_TYPE}?properties=firstname,lastname,email`;
    
    try {
        const response = await axios.get(url, hubspotHeaders);
        const records = response.data.results;
        
        let html = '<h1>HubSpot CRM Records</h1><a href="/update-cobj">Add New Record</a><br/><br/>';
        html += '<table border="1" cellpadding="8"><tr><th>ID</th><th>First Name</th><th>Last Name / Breed</th><th>Email</th></tr>';
        
        records.forEach(item => {
            html += `<tr>
                <td>${item.id}</td>
                <td>${item.properties.firstname || ''}</td>
                <td>${item.properties.lastname || ''}</td>
                <td>${item.properties.email || ''}</td>
            </tr>`;
        });
        
        html += '</table>';
        res.send(html);
    } catch (error) {
        console.error('Error fetching records:', error.response ? error.response.data : error.message);
        res.status(500).send('Error retrieving records from HubSpot.');
    }
});

// STEP 12 — GET /update-cobj Route (Render Form)
app.get('/update-cobj', (req, res) => {
    res.render('updates');
});

// STEP 13 — POST /update-cobj Route (Submit Form)
// STEP 13 — POST /update-cobj Route (Submit Form)
app.post('/update-cobj', async (req, res) => {
    // Destructure properties matching the form inputs
    const { firstname, lastname, email } = req.body;
    const createUrl = `https://api.hubapi.com/crm/v3/objects/${CUSTOM_OBJECT_TYPE}`;

    const payload = {
        properties: {
            firstname: firstname,
            lastname: lastname,
            email: email
        }
    };

    try {
        await axios.post(createUrl, payload, hubspotHeaders);
        res.redirect('/');
    } catch (error) {
        console.error('Error creating record:', error.response ? error.response.data : error.message);
        res.status(500).send('Failed to create record in HubSpot.');
    }
});

// Keep process active by listening on PORT
app.listen(PORT, () => {
    console.log(`Server is running successfully on http://localhost:${PORT}`);
});