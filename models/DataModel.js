const mongoose = require('mongoose');
const ParsedData = require('./ParsedData');
const { connectDB } = require('../config/database');

const Database = async () => {
    try {
        await connectDB();
        const results = await ParsedData.find({});
        console.log(results);
    } catch (error) {

    }
};

Database();
