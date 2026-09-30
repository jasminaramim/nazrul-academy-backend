import { Request, Response } from 'express';
import { Reunion } from '../model/reunionModel';

export const getReunions = async (req: Request, res: Response) => {
  try {
    const reunions = await Reunion.find().sort({ year: -1 });
    res.json(reunions);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const getActiveReunion = async (req: Request, res: Response) => {
  try {
    const active = await Reunion.findOne({ isActive: true });
    res.json(active || null);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const createReunion = async (req: Request, res: Response) => {
  try {
    const { id, title, year, isActive } = req.body;
    
    // If setting this one to active, unset others
    if (isActive) {
      await Reunion.updateMany({}, { isActive: false });
    }

    const reunion = await Reunion.create({ id, title, year, isActive });
    res.status(201).json(reunion);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const updateReunion = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, year, isActive } = req.body;

    // If setting this one to active, unset others
    if (isActive) {
      await Reunion.updateMany({ id: { $ne: id } }, { isActive: false });
    }

    const reunion = await Reunion.findOneAndUpdate(
      { id },
      { title, year, isActive },
      { new: true }
    );

    res.json(reunion);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteReunion = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if it's the active one
    const reunion = await Reunion.findOne({ id });
    if (!reunion) {
      return res.status(404).json({ error: 'Reunion not found' });
    }
    
    if (reunion.isActive) {
      return res.status(400).json({ error: 'Cannot delete the active reunion event.' });
    }

    await Reunion.findOneAndDelete({ id });
    res.json({ message: 'Reunion deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
