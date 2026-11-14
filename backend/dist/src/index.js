"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const db_1 = __importDefault(require("./db"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Health check and root routes
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.get('/db-health', async (_req, res) => {
    try {
        const rawResult = await db_1.default.raw('SELECT 1+1 AS result');
        const tables = await (0, db_1.default)('information_schema.tables')
            .where({ table_schema: 'public' })
            .select('table_name');
        res.json({
            status: 'database connected',
            rawResult: rawResult.rows,
            tables: tables.map((t) => t.table_name),
        });
    }
    catch (error) {
        console.error('Database health check failed:', error);
        res.status(500).json({
            status: 'database error',
            message: (error === null || error === void 0 ? void 0 : error.message) || String(error),
            code: error === null || error === void 0 ? void 0 : error.code,
        });
    }
});
app.all('/migrate', async (_req, res) => {
    try {
        const [batchNo, log] = await db_1.default.migrate.latest();
        res.json({
            success: true,
            message: `Batch ${batchNo} ran ${log.length} migrations`,
            migrations: log,
        });
    }
    catch (error) {
        console.error('Migration failed:', error);
        res.status(500).json({
            success: false,
            message: (error === null || error === void 0 ? void 0 : error.message) || String(error),
            code: error === null || error === void 0 ? void 0 : error.code,
        });
    }
});
app.get('/', (_req, res) => {
    res.json({
        message: 'Scheduler API is running',
        endpoints: ['/slots', '/health', '/db-health', '/migrate'],
    });
});
app.post('/slots', async (req, res) => {
    try {
        const { day_of_week, start_time, end_time } = req.body;
        if (day_of_week === undefined ||
            !start_time ||
            !end_time ||
            day_of_week < 0 ||
            day_of_week > 6) {
            return res.status(400).json({ error: 'Invalid slot data' });
        }
        const existingSlotsCount = await (0, db_1.default)('slots').where({ day_of_week }).count('* as count').first();
        if (existingSlotsCount && Number(existingSlotsCount.count) >= 2) {
            return res.status(400).json({ error: 'Maximum 2 slots allowed per day' });
        }
        const [slot] = await (0, db_1.default)('slots').insert({ day_of_week, start_time, end_time }).returning('*');
        res.json(slot);
    }
    catch (error) {
        console.error('Error creating slot:', error);
        res.status(500).json({
            error: 'Failed to create slot',
            message: (error === null || error === void 0 ? void 0 : error.message) || String(error),
            code: error === null || error === void 0 ? void 0 : error.code,
        });
    }
});
app.get('/slots', async (req, res) => {
    try {
        const { week } = req.query;
        if (!week || typeof week !== 'string') {
            return res.status(400).json({ error: 'Week query param required (YYYY-MM-DD)' });
        }
        // Parse date reliably using UTC to avoid server timezone skew
        const parts = week.split('-').map(Number);
        if (parts.length !== 3 || parts.some(isNaN)) {
            return res.status(400).json({ error: 'Invalid week date format. Use YYYY-MM-DD.' });
        }
        const [year, month, day] = parts;
        const inputDate = new Date(Date.UTC(year, month - 1, day));
        const dayOfWeek = inputDate.getUTCDay();
        // Sunday (offset 0) through Saturday (offset 6) of this week
        const weekDates = [...Array(7).keys()].map((offset) => {
            const date = new Date(inputDate);
            date.setUTCDate(inputDate.getUTCDate() - dayOfWeek + offset);
            return date.toISOString().slice(0, 10);
        });
        console.log('Week dates:', weekDates);
        const recurringSlots = await (0, db_1.default)('slots').select();
        console.log('Recurring slots count:', recurringSlots.length);
        const exceptions = await (0, db_1.default)('slot_exceptions')
            .whereIn('date', weekDates)
            .orderBy('id', 'asc');
        console.log('Exceptions count:', exceptions.length);
        const calendar = weekDates.map((date) => {
            const [y, m, d] = date.split('-').map(Number);
            const currentDayOfWeek = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
            let slots = recurringSlots
                .filter((slot) => slot.day_of_week === currentDayOfWeek)
                .map((slot) => ({
                id: slot.id,
                date,
                start_time: slot.start_time,
                end_time: slot.end_time,
                exception: false,
            }));
            exceptions
                .filter((ex) => {
                let exDateStr;
                if (typeof ex.date === 'string') {
                    exDateStr = ex.date.slice(0, 10);
                }
                else if (ex.date instanceof Date) {
                    exDateStr = ex.date.toISOString().slice(0, 10);
                }
                else {
                    exDateStr = String(ex.date).slice(0, 10);
                }
                return exDateStr === date;
            })
                .forEach((ex) => {
                const index = slots.findIndex((s) => String(s.id) === String(ex.slot_id));
                if (ex.status === 'deleted') {
                    if (index !== -1)
                        slots.splice(index, 1);
                }
                else if (ex.status === 'edited') {
                    if (index !== -1) {
                        slots[index].start_time = ex.new_start_time;
                        slots[index].end_time = ex.new_end_time;
                        slots[index].exception = true;
                    }
                }
            });
            return { date, slots };
        });
        res.json({ weekStart: weekDates[0], weekEnd: weekDates[6], calendar });
    }
    catch (error) {
        console.error('Error fetching slots:', error);
        res.status(500).json({
            error: 'Failed to fetch slots',
            message: (error === null || error === void 0 ? void 0 : error.message) || String(error),
            code: error === null || error === void 0 ? void 0 : error.code,
        });
    }
});
app.patch('/slots/:id', async (req, res) => {
    try {
        const slotId = Number(req.params.id);
        const { date, new_start_time, new_end_time } = req.body;
        if (!date || !new_start_time || !new_end_time) {
            return res.status(400).json({ error: 'Missing fields for updating exception' });
        }
        const [y, m, d] = date.split('-').map(Number);
        const weekDay = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
        const recurringCountObj = await (0, db_1.default)('slots').where({ day_of_week: weekDay }).count('id as count').first();
        const recurringCount = Number((recurringCountObj === null || recurringCountObj === void 0 ? void 0 : recurringCountObj.count) || 0);
        const exceptionCountObj = await (0, db_1.default)('slot_exceptions')
            .where('date', date)
            .andWhere('slot_id', '!=', slotId)
            .andWhere('status', '!=', 'deleted')
            .count('id as count')
            .first();
        const exceptionCount = Number((exceptionCountObj === null || exceptionCountObj === void 0 ? void 0 : exceptionCountObj.count) || 0);
        const totalCount = recurringCount - 1 + exceptionCount + 1;
        if (totalCount > 2) {
            return res.status(400).json({ error: 'Maximum 2 slots allowed per day' });
        }
        const existingException = await (0, db_1.default)('slot_exceptions')
            .where({ slot_id: slotId, date })
            .first();
        if (existingException) {
            await (0, db_1.default)('slot_exceptions')
                .where({ id: existingException.id })
                .update({
                status: 'edited',
                new_start_time,
                new_end_time,
                updated_at: db_1.default.fn.now(),
            });
        }
        else {
            await (0, db_1.default)('slot_exceptions').insert({
                slot_id: slotId,
                date,
                status: 'edited',
                new_start_time,
                new_end_time,
            });
        }
        res.json({ message: 'Slot exception (edit) created' });
    }
    catch (error) {
        console.error('Error updating slot:', error);
        res.status(500).json({
            error: 'Failed to update slot',
            message: (error === null || error === void 0 ? void 0 : error.message) || String(error),
            code: error === null || error === void 0 ? void 0 : error.code,
        });
    }
});
app.delete('/slots/:id', async (req, res) => {
    try {
        const slotId = Number(req.params.id);
        const { date } = req.query;
        if (!date || typeof date !== 'string') {
            return res.status(400).json({ error: 'Date query parameter required for deleting exception' });
        }
        const existingException = await (0, db_1.default)('slot_exceptions')
            .where({ slot_id: slotId, date })
            .first();
        if (existingException) {
            await (0, db_1.default)('slot_exceptions')
                .where({ id: existingException.id })
                .update({
                status: 'deleted',
                new_start_time: null,
                new_end_time: null,
                updated_at: db_1.default.fn.now(),
            });
        }
        else {
            await (0, db_1.default)('slot_exceptions').insert({
                slot_id: slotId,
                date,
                status: 'deleted',
            });
        }
        res.json({ message: 'Slot exception (delete) created' });
    }
    catch (error) {
        console.error('Error deleting slot for date:', error);
        res.status(500).json({
            error: 'Failed to delete slot for date',
            message: (error === null || error === void 0 ? void 0 : error.message) || String(error),
            code: error === null || error === void 0 ? void 0 : error.code,
        });
    }
});
app.use((_req, res) => {
    res.status(404).json({ error: 'Not Found' });
});
const PORT = process.env.PORT || 3001;
app.listen(PORT, async () => {
    console.log(`Backend running on http://localhost:${PORT}`);
    // Attempt to auto-run pending migrations on startup
    try {
        const [batchNo, log] = await db_1.default.migrate.latest();
        if (log.length > 0) {
            console.log(`Applied migrations (batch ${batchNo}):`, log);
        }
        else {
            console.log('Database schema is already up to date.');
        }
    }
    catch (err) {
        console.error('Startup migration notice:', (err === null || err === void 0 ? void 0 : err.message) || err);
    }
});
