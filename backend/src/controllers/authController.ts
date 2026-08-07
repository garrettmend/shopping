import bcrypt from 'bcryptjs';
import prisma from '../prisma.js';
import { generateToken } from '../middleware/auth.js';

export const register = async (req: any, res: any) => {
  try {
    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword }
    });
    res.status(201).json({ message: 'User created', userId: user.id });
  } catch (error) {
    res.status(400).json({ error: 'Email already exists or invalid data' });
  }
};

export const login = async (req: any, res: any) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = generateToken({ userId: user.id, email: user.email });
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
