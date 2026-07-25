const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const dataPath = path.join(__dirname, 'data.json');
let currentApplicationId = null;

function loadData() {
  if (!fs.existsSync(dataPath)) {
    fs.writeFileSync(dataPath, JSON.stringify({ applications: [] }, null, 2));
  }
  return JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
}

function saveData(data) {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

function findCurrentApplication(data) {
  if (currentApplicationId === null) {
    return null;
  }
  return data.applications.find((item) => item.id === currentApplicationId) || null;
}

app.get('/api/applications', (req, res) => {
  const data = loadData();
  res.json(data.applications);
});

app.get('/api/applications/:id', (req, res) => {
  const data = loadData();
  const application = data.applications.find((item) => item.id === Number(req.params.id));
  if (!application) {
    return res.status(404).json({ message: 'Application not found' });
  }
  res.json(application);
});

app.post('/api/applications', (req, res) => {
  const payload = req.body;
  const data = loadData();
  const nextId = data.applications.length ? data.applications[data.applications.length - 1].id + 1 : 1;
  const newApplication = {
    id: nextId,
    applicationNumber: `SAY-${String(nextId).padStart(5, '0')}`,
    createdAt: new Date().toISOString(),
    ...payload
  };
  data.applications.push(newApplication);
  saveData(data);
  res.status(201).json(newApplication);
});

app.post('/ms-application-registration/api/v1/register-application/initialize', (req, res) => {
  const data = loadData();
  let application = findCurrentApplication(data);

  if (!application) {
    const nextId = data.applications.length ? data.applications[data.applications.length - 1].id + 1 : 1;
    const applicationNumber = `SAY-${String(nextId).padStart(5, '0')}`;
    const applicationDate = new Date().toISOString().slice(0, 10);

    application = {
      id: nextId,
      applicationNumber,
      applicationDate,
      status: 'Draft',
      pageId: 'AR001',
      data: {
        firstName: '',
        middleName: '',
        lastName: '',
        mobileNumber: '',
        emailAddress: '',
        applicationDate
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    data.applications.push(application);
    currentApplicationId = nextId;
    saveData(data);
  }

  res.status(200).json(application);
});

app.post('/ms-application-registration/api/v1/register-application/next', (req, res) => {
  const data = loadData();
  const application = findCurrentApplication(data);

  if (!application) {
    return res.status(404).json({ message: 'Current application not found' });
  }

  const pageId = req.body.pageId || application.pageId || 'AR001';
  const nextApplicationDate = req.body.applicationDate || application.applicationDate;

  application.data = {
    ...application.data,
    ...req.body
  };
  application.pageId = pageId;
  application.applicationDate = nextApplicationDate;
  application.status = 'Draft';
  application.updatedAt = new Date().toISOString();

  saveData(data);

  res.json({
    applicationNumber: application.applicationNumber,
    applicationDate: application.applicationDate,
    pageId: application.pageId,
    data: application.data,
    status: application.status
  });
});

app.post('/ms-application-registration/api/v1/register-application/submit', (req, res) => {
  const data = loadData();
  const application = findCurrentApplication(data);

  if (!application) {
    return res.status(404).json({ message: 'Current application not found' });
  }

  application.data = {
    ...application.data,
    ...req.body
  };
  application.pageId = 'AR005';
  application.status = 'Submitted';
  application.updatedAt = new Date().toISOString();

  saveData(data);

  res.json({
    applicationNumber: application.applicationNumber,
    applicationDate: application.applicationDate,
    pageId: application.pageId,
    data: application.data,
    status: application.status
  });
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Mock API server running on http://localhost:${port}`);
});
