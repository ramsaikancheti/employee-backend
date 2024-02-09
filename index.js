const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { Schema } = mongoose;
const { Types } = require('mongoose');

const Size = global.Size;
const app = express();
const PORT = process.env.PORT || 3050;
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const mongoDBAtlasIP = 'mongodb+srv://ram:ram123456789@cluster0.7k8qjfa.mongodb.net/';
mongoose.connect(`${mongoDBAtlasIP}employee`);


const employeeSchema = new mongoose.Schema({
    employeeId: { type: Number, required: true, unique: true },
    name: { type: String, required: true },
    age: { type: Number, required: true },
    salary: { type: Number, required: true},
    exp: { type: String, required: true },
    photo: { type: String },
});

const Employee = mongoose.model('Employee', employeeSchema);

 async function getNextEmployeeId() {
    try {
        const highestEmployee = await Employee.findOne({}, { employeeId: 1 }).sort({ employeeId: -1 });
        return highestEmployee ? highestEmployee.employeeId + 1 : 1;
    } catch (error) {
        console.error('Error getting next employee ID:', error);
        throw error;
    }
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const fileName = uuidv4() + path.extname(file.originalname.toLowerCase());
        cb(null, fileName);
    },
});

const upload = multer({ storage });

app.post('/api/employees', upload.single('photo'), async (req, res) => {
    console.log(req);
    try {
        const { name, age, salary, exp } = req.body;

        const employeeId = await getNextEmployeeId();

        const newEmployee = new Employee({
            employeeId,
            name,
            age,
            salary,
            exp,
            photo: req.file ? 'uploads/' + req.file.filename : "",
        });

        await newEmployee.save();

        const allEmployees = await Employee.find();

        res.status(201).json({ success: true, message: 'Employee added successfully', employee: newEmployee, allEmployees });
    } catch (error) {
        console.error('Error adding employee:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


app.get('/api/getemployees', async (req, res) => {
    try {
        const employees = await Employee.find();
        res.status(200).json({ employees });
    } catch (error) {
        console.error('Error getting employees:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});
 

app.get('/api/getemployees/:employeeId', async (req, res) => {
    try {
        const employeeId = req.params.employeeId;

         const employee = await Employee.findOne({ employeeId });

        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        res.status(200).json({ employee });
    } catch (error) {
        console.error('Error getting employee:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});
 
app.put('/api/employees/:employeeId', upload.single('photo'), async (req, res) => {
    try {
        const employeeId = req.params.employeeId;
        const { name, age, exp } = req.body;

         const employee = await Employee.findOne({ employeeId });

        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }

         employee.ame = name || employee.name;
        employee.age = age || employee.age;
        employee.exp = exp || employee.exp;

         if (req.file) {
            employee.photo = req.file.filename;
        }

         await employee.save();

        res.status(200).json({ message: 'Employee updated successfully', employee });
    } catch (error) {
        console.error('Error updating employee:', error);
        res.status(500).json({ success:false, message: 'Internal Server Error' });
    }
});

app.delete('/api/deleteemployee/:employeeId', async (req, res) => {
    try {
        const employeeId = req.params.employeeId;

         const deletedEmployee = await Employee.findOneAndDelete({ employeeId });

        if (!deletedEmployee) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        res.status(200).json({success:true, message: 'Employee deleted successfully', employee: deletedEmployee });
    } catch (error) {
        console.error('Error deleting employee:', error);
        res.status(500).json({success: true, message: 'Internal Server Error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
}); 
