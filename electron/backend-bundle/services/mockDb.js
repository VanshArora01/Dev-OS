const fs = require('fs');
const path = require('path');

const STORAGE_DIR = path.join(__dirname, '../data');
if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR);
}

const RISK_LOGS_FILE = path.join(STORAGE_DIR, 'risk_logs.json');
const ALERTS_FILE = path.join(STORAGE_DIR, 'alerts.json');

const readJSON = (file) => {
    if (!fs.existsSync(file)) return [];
    try {
        return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (e) {
        return [];
    }
};

const writeJSON = (file, data) => {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
};

class MockModel {
    constructor(file) {
        this.file = file;
    }

    async save(data) {
        const items = readJSON(this.file);
        const newItem = {
            ...data,
            id: Math.random().toString(36).substr(2, 9),
            createdAt: new Date(),
            updatedAt: new Date()
        };
        items.push(newItem);
        writeJSON(this.file, items);
        return newItem;
    }

    async find() {
        return readJSON(this.file);
    }
}

module.exports = {
    RiskLog: new MockModel(RISK_LOGS_FILE),
    Alert: new MockModel(ALERTS_FILE)
};
