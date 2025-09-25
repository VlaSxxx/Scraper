const mongoose = require('mongoose');

// Простая схема для сохранения спарсенных данных
const ParsedDataSchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: true 
    },
    content: { 
        type: String, 
        required: true 
    },
    url: { 
        type: String, 
        required: true 
    },
    dateParsed: { 
        type: Date, 
        default: Date.now 
    },
    status: {
        type: String,
        enum: ['success', 'error'],
        default: 'success'
    },
    rawData: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true
});

// Индекс для быстрого поиска
ParsedDataSchema.index({ url: 1, dateParsed: -1 });
ParsedDataSchema.index({ status: 1 });

module.exports = mongoose.model('ParsedData', ParsedDataSchema);
