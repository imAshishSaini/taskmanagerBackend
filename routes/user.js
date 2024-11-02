const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { User } = require('../schema/user.schema')
const dotenv = require('dotenv')
const authMiddleware = require('../middleware/auth')
dotenv.config()

router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body
        console.log(name, email, password)

        const isUserExists = await User.findOne({ email })
        if (isUserExists) {
            return res.status(400).json({ message: 'User already exists' })
        }
        const hashedPassword = await bcrypt.hash(password, 10)
        const user = new User({ name, email, password: hashedPassword })
        await user.save()
        res.status(201).send({ message: 'User registered successfully' })
    } catch (error) {
        console.error('Error during registration:', error)
        res.status(500).send({ message: 'User registration failed', error })
    }
})

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body
        console.log(email, password)
        const user = await User.findOne({ email })
        console.log(user)
        if (!user) {
            return res.status(400).send({ message: 'Invalid credentials' })
        }
        const isPasswordValid = await bcrypt.compare(password, user.password)
        if (!isPasswordValid) {
            return res.status(400).send({ message: 'Invalid credentials' })
        }
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' })
        res.status(200).json({ token })
    } catch (error) {
        console.error('Error during login:', error)
        res.status(500).send({ message: 'Login failed', error })
    }
})

router.get('/verify', authMiddleware, async (req, res) => {
    res.status(200).json({ message: '' })
})

router.get('/dashboard', authMiddleware, async (req, res) => {
    res.status(200).json({ message: 'Dashboard' })
})

router.get('/setting', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password')
        if (!user) return res.status(404).json({ message: 'User not found' })
        res.status(200).json(user)
    } catch (error) {
        console.error('Error fetching user:', error)
        res.status(500).json({ message: 'Failed to fetch user data' })
    }
})

router.post('/update', authMiddleware, async (req, res) => {
    const { name, updateEmail, oldPassword, newPassword } = req.body
    console.log(name, updateEmail, oldPassword, newPassword)

    try {
        const user = await User.findById(req.user.id)

        if (name == null) {
            return res.status(400).json({ message: 'Name is required' })
        }

        if (updateEmail && updateEmail !== user.email) {
            const emailExists = await User.findOne({ email: updateEmail })
            if (emailExists) {
                return res.status(400).json({ message: 'Email already in use' })
            }
            user.email = updateEmail
        }

        const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password)
        if (!isOldPasswordValid) {
            return res.status(400).json({ message: 'Old password is incorrect' })
        }

        if (newPassword && newPassword.length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters long' })
        }

        if (name) user.name = name

        if (newPassword) {
            const hashedNewPassword = await bcrypt.hash(newPassword, 10)
            user.password = hashedNewPassword
        }

        await user.save()
        res.status(200).json({ message: 'User information updated successfully' })
    } catch (error) {
        console.error('Error updating user:', error)
        res.status(500).json({ message: 'User update failed', error })
    }
})

router.get('/search', authMiddleware, async (req, res) => {
    try {
        const { email } = req.query
        const users = await User.find({
            email: { $regex: `^${email}`, $options: 'i' }
        }).select('email -_id')

        const filteredUsers = users.filter(u => u.email !== req.user.email)
        res.status(200).json(filteredUsers)
    } catch (error) {
        console.error('Error fetching users:', error)
        res.status(500).json({ message: 'Failed to fetch users' })
    }
})

router.get('/name', authMiddleware, async (req, res) => {
    try {
      const { id } = req.query
      const user = await User.findById(id)
      console.log(user)
      if (!user) {
        return res.status(404).json({ message: 'User not found' })
      }
      res.status(200).json({ name: user.name })
    } catch (error) {
      console.error('Error fetching user:', error)
      res.status(500).json({ message: 'Failed to fetch user' })
    }
  })
  

module.exports = router