import { Request, Response } from 'express';
import Label from '../models/Label.model';

/**
 * Get all labels
 */
export const getLabels = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type } = req.query;

    const query: any = {};
    if (type) {
      query.type = type;
    }

    const labels = await Label.find(query)
      .sort({ type: 1, name: 1 })
      .select('-__v');

    res.json({ labels });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to get labels' });
  }
};

/**
 * Get label by ID
 */
export const getLabelById = async (req: Request, res: Response): Promise<void> => {
  try {
    const label = await Label.findById(req.params.id).select('-__v');

    if (!label) {
      res.status(404).json({ message: 'Label not found' });
      return;
    }

    res.json({ label });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to get label' });
  }
};

/**
 * Create label (Admin only)
 */
export const createLabel = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, color, type, icon, description, isDefault } = req.body;

    if (!name || !color || !type) {
      res.status(400).json({ message: 'Name, color, and type are required' });
      return;
    }

    if (!['task_type', 'status', 'difficulty', 'priority'].includes(type)) {
      res.status(400).json({ message: 'Invalid label type' });
      return;
    }

    const label = await Label.create({
      name,
      color,
      type,
      icon: icon || 'mdi:label',
      description,
      isDefault: isDefault || false
    });

    res.status(201).json({
      message: 'Label created successfully',
      label
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to create label' });
  }
};

/**
 * Update label (Admin only)
 */
export const updateLabel = async (req: Request, res: Response): Promise<void> => {
  try {
    const label = await Label.findById(req.params.id);

    if (!label) {
      res.status(404).json({ message: 'Label not found' });
      return;
    }

    const { name, color, type, icon, description, isDefault } = req.body;

    if (name) label.name = name;
    if (color) label.color = color;
    if (type) {
      if (!['task_type', 'status', 'difficulty', 'priority'].includes(type)) {
        res.status(400).json({ message: 'Invalid label type' });
        return;
      }
      label.type = type;
    }
    if (icon) label.icon = icon;
    if (description !== undefined) label.description = description;
    if (isDefault !== undefined) label.isDefault = isDefault;

    await label.save();

    res.json({
      message: 'Label updated successfully',
      label
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to update label' });
  }
};

/**
 * Delete label (Admin only)
 */
export const deleteLabel = async (req: Request, res: Response): Promise<void> => {
  try {
    const label = await Label.findById(req.params.id);

    if (!label) {
      res.status(404).json({ message: 'Label not found' });
      return;
    }

    if (label.isDefault) {
      res.status(400).json({ message: 'Cannot delete default label' });
      return;
    }

    await Label.findByIdAndDelete(req.params.id);

    res.json({ message: 'Label deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to delete label' });
  }
};

