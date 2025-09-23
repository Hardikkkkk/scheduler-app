import express, { Request, Response } from 'express';
import cors from 'cors';
import db from './db';

const app = express();

app.use(cors());
app.use(express.json());

app.post('/slots', async (req: Request, res: Response) => {
  try {
    const { day_of_week, start_time, end_time } = req.body;
    if (
      day_of_week === undefined ||
      !start_time ||
      !end_time ||
      day_of_week < 0 ||
      day_of_week > 6
    ) {
      return res.status(400).json({ error: 'Invalid slot data' });
    }

 
    const existingSlotsCount = await db('slots').where({ day_of_week }).count('* as count').first();
    if (existingSlotsCount && existingSlotsCount.count >= '2') {
      return res.status(400).json({ error: 'Maximum 2 slots allowed per day' });
    }

    const [slot] = await db('slots').insert({ day_of_week, start_time, end_time }).returning('*');
    res.json(slot);
  }catch (error) {
    res.status(500).json({ error: 'Failed to create slot' });
  }
});


app.get('/slots', async (req: Request, res: Response) => {
  try {
    const { week } = req.query as { week?: string };
    if (!week) {
      return res.status(400).json({ error: 'Week query param required' });
    }
    const weekStart = new Date(week);
    const weekDay = weekStart.getDay();

    const weekDates = [...Array(7).keys()].map((offset) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() - weekDay + offset);
      return date.toISOString().slice(0, 10);
    });

    console.log('Week dates:', weekDates);


    const recurringSlots = await db('slots').select();
    console.log('Recurring slots:', recurringSlots);

    const exceptions = await db('slot_exceptions').whereIn('date', weekDates);
    console.log('Exceptions:', exceptions);

    const calendar = weekDates.map((date) => {
      const day = new Date(date).getDay();
      let slots = recurringSlots
        .filter((slot) => slot.day_of_week === day)
        .map((slot) => ({
          id: slot.id,
          date,
          start_time: slot.start_time,
          end_time: slot.end_time,
          exception: false,
        }));

        exceptions
        .filter(ex => {
            const exDateLocal = new Date(Date.UTC(
            ex.date.getFullYear(),
            ex.date.getMonth(),
            ex.date.getDate()
            )).toISOString().split('T')[0];
            return exDateLocal === date;
        })
        .forEach(ex => {
            const index = slots.findIndex(s => String(s.id) === String(ex.slot_id));
            if (ex.status === 'deleted') {
            if (index !== -1) slots.splice(index, 1);
            } else if (ex.status === 'edited') {
            if (index !== -1) {
                slots[index].start_time = ex.new_start_time;
                slots[index].end_time = ex.new_end_time;
                slots[index].exception = true;
            }
            }
        });



      return { date, slots };
    });

    console.log('Final calendar:', calendar);

    res.json({ weekStart: weekDates[0], weekEnd: weekDates[6], calendar });
  } catch (error) {
    console.error('Error fetching slots:', error);
    res.status(500).json({ error: 'Failed to fetch slots' });
  }
});


app.patch('/slots/:id', async (req: Request, res: Response) => {
  try {
    const slotId = Number(req.params.id);
    const { date, new_start_time, new_end_time } = req.body;
    if (!date || !new_start_time || !new_end_time) {
      return res.status(400).json({ error: 'Missing fields for updating exception' });
    }

    const weekDay = new Date(date).getDay();

    const recurringCountObj = await db('slots').where({ day_of_week: weekDay }).count('id as count').first();
    const recurringCount = Number(recurringCountObj?.count || 0);

    const exceptionCountObj = await db('slot_exceptions')
    .where('date', date)
    .andWhere('slot_id', '!=', slotId)
    .andWhere('status', '!=', 'deleted')
    .count('id as count')
    .first();
    const exceptionCount = Number(exceptionCountObj?.count || 0);

    const totalCount = recurringCount - 1 + exceptionCount + 1;

    if (totalCount > 2) {
      return res.status(400).json({ error: 'Maximum 2 slots allowed per day' });
    }

    await db('slot_exceptions').insert({
      slot_id: slotId,
      date,
      status: 'edited',
      new_start_time,
      new_end_time,
    });

    res.json({ message: 'Slot exception (edit) created' });
  }catch (error) {
    res.status(500).json({ error: 'Failed to update slot' });
  }
});


app.delete('/slots/:id', async (req: Request, res: Response) => {
  try {
    const slotId = Number(req.params.id);
    const { date } = req.query;

    if (!date || typeof date !== 'string') {
      return res.status(400).json({ error: 'Date query parameter required for deleting exception' });
    }

    await db('slot_exceptions').insert({
      slot_id: slotId,
      date,
      status: 'deleted',
    });

    res.json({ message: 'Slot exception (delete) created' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete slot for date' });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
