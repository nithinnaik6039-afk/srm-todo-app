/**
 * SRM Todo App — Comprehensive Seed Script
 * Run: node seed.js
 * Seeds: Users, Todos, Attendance, Polls, IA Records, Feedback, Timetable, Comments
 */

import mongoose from 'mongoose';
import bcrypt   from 'bcryptjs';
import dotenv   from 'dotenv';
import crypto   from 'crypto';
dotenv.config();

// ── Models ──────────────────────────────────────────────────────────────────
import User       from './models/User.js';
import Todo       from './models/Todo.js';
import Attendance from './models/Attendance.js';
import Poll       from './models/Poll.js';
import IARecord   from './models/IARecord.js';
import Feedback   from './models/Feedback.js';
import Timetable  from './models/Timetable.js';
import Comment    from './models/Comment.js';
import TimeEntry  from './models/TimeEntry.js';

// ── Connect ──────────────────────────────────────────────────────────────────
await mongoose.connect(process.env.MONGO_URI);
console.log('✅ Connected to MongoDB\n');

// ── Clear existing data ──────────────────────────────────────────────────────
console.log('🗑️  Clearing old seed data...');
await Promise.all([
  User.deleteMany({ email: { $in: [
    'admin@srm.edu.in', 'faculty@srm.edu.in', 'faculty2@srm.edu.in',
    'nithin@srm.edu.in', 'priya@srm.edu.in', 'raj@srm.edu.in', 'ananya@srm.edu.in',
  ] } }),
]);

const hashedPassword = await bcrypt.hash('Password@123', 10);

// ── Create Users ─────────────────────────────────────────────────────────────
console.log('👤 Creating users...');
const [admin, faculty1, faculty2, student1, student2, student3, student4] = await User.insertMany([
  {
    name: 'Dr. Admin Kumar',
    email: 'admin@srm.edu.in',
    password: hashedPassword,
    role: 'admin',
    department: 'CSE',
    regNumber: 'ADMIN001',
  },
  {
    name: 'Prof. Priya Sharma',
    email: 'faculty@srm.edu.in',
    password: hashedPassword,
    role: 'faculty',
    department: 'CSE',
    regNumber: 'FAC001',
  },
  {
    name: 'Dr. Venkat Rao',
    email: 'faculty2@srm.edu.in',
    password: hashedPassword,
    role: 'faculty',
    department: 'CSE',
    regNumber: 'FAC002',
  },
  {
    name: 'Nithin Nayak',
    email: 'nithin@srm.edu.in',
    password: hashedPassword,
    role: 'student',
    department: 'CSE',
    regNumber: 'RA2211003010001',
  },
  {
    name: 'Priya Menon',
    email: 'priya@srm.edu.in',
    password: hashedPassword,
    role: 'student',
    department: 'CSE',
    regNumber: 'RA2211003010002',
  },
  {
    name: 'Raj Patel',
    email: 'raj@srm.edu.in',
    password: hashedPassword,
    role: 'student',
    department: 'CSE',
    regNumber: 'RA2211003010003',
  },
  {
    name: 'Ananya Singh',
    email: 'ananya@srm.edu.in',
    password: hashedPassword,
    role: 'student',
    department: 'ECE',
    regNumber: 'RA2211003020001',
  },
]);

console.log(`   ✅ Created ${7} users`);
console.log(`   📌 Admin:    admin@srm.edu.in / Password@123`);
console.log(`   📌 Faculty:  faculty@srm.edu.in / Password@123`);
console.log(`   📌 Student:  nithin@srm.edu.in / Password@123`);

// ── Create Todos ─────────────────────────────────────────────────────────────
console.log('\n📝 Creating todos...');
const now = new Date();
const d   = (days) => { const dt = new Date(now); dt.setDate(dt.getDate() + days); return dt; };

const todos = await Todo.insertMany([
  // Nithin's todos
  {
    title: 'Submit DBMS Assignment 3',
    description: 'Complete ER diagram and normalization for the library management system',
    priority: 'high', category: 'academic', completed: false,
    dueDate: d(1), tags: ['DBMS','assignment'], visibility: 'private',
    labelColor: '#6c63ff', department: 'CSE', createdBy: student1._id,
    shareToken: crypto.randomBytes(16).toString('hex'),
  },
  {
    title: 'Prepare for Networks Mid Exam',
    description: 'Cover OSI model, TCP/IP, routing algorithms, subnetting',
    priority: 'high', category: 'academic', completed: false,
    dueDate: d(3), tags: ['Networks','exam'], visibility: 'department',
    labelColor: '#ef4444', department: 'CSE', createdBy: student1._id,
    shareToken: crypto.randomBytes(16).toString('hex'),
  },
  {
    title: 'Complete DSA Lab Exercises',
    description: 'Implement BST insertion, deletion, and traversal in C++',
    priority: 'medium', category: 'academic', completed: true,
    dueDate: d(-2), tags: ['DSA','lab'], visibility: 'private',
    labelColor: '#10b981', department: 'CSE', createdBy: student1._id,
    shareToken: crypto.randomBytes(16).toString('hex'),
  },
  {
    title: 'Register for Sports Day',
    description: 'Register for 100m sprint and relay events',
    priority: 'low', category: 'event', completed: true,
    dueDate: d(-5), tags: ['sports','event'], visibility: 'public',
    labelColor: '#f59e0b', department: 'CSE', createdBy: student1._id,
    shareToken: crypto.randomBytes(16).toString('hex'),
  },
  {
    title: 'Apply for Internship — Amazon',
    description: 'Submit resume and cover letter for SDE internship program',
    priority: 'high', category: 'personal', completed: false,
    dueDate: d(7), tags: ['internship','career'], visibility: 'private',
    labelColor: '#3b82f6', department: 'CSE', createdBy: student1._id,
    shareToken: crypto.randomBytes(16).toString('hex'),
  },
  {
    title: 'OS Mini Project Submission',
    description: 'Build a simple shell with piping and redirection support',
    priority: 'high', category: 'academic', completed: false,
    dueDate: d(5), tags: ['OS','project'], visibility: 'private',
    department: 'CSE', createdBy: student1._id,
    shareToken: crypto.randomBytes(16).toString('hex'),
  },
  {
    title: 'Read Chapter 7 — Software Engineering',
    description: 'SDLC models, Agile, Waterfall — focus on testing strategies',
    priority: 'medium', category: 'academic', completed: false,
    dueDate: d(4), tags: ['SE','reading'], visibility: 'private',
    department: 'CSE', createdBy: student1._id,
    shareToken: crypto.randomBytes(16).toString('hex'),
  },
  {
    title: 'Pay Hostel Fee',
    description: 'Pay Q3 hostel fee at the accounts section before late fee applies',
    priority: 'high', category: 'admin', completed: false,
    dueDate: d(2), tags: ['fee','hostel'], visibility: 'private',
    labelColor: '#ec4899', department: 'CSE', createdBy: student1._id,
    shareToken: crypto.randomBytes(16).toString('hex'),
  },
  // Priya's todos
  {
    title: 'Machine Learning Project — Image Classification',
    description: 'Train CNN on CIFAR-10 dataset, achieve >85% accuracy',
    priority: 'high', category: 'academic', completed: false,
    dueDate: d(10), tags: ['ML','project','CNN'], visibility: 'department',
    department: 'CSE', createdBy: student2._id,
    shareToken: crypto.randomBytes(16).toString('hex'),
  },
  {
    title: 'Submit Research Paper Draft',
    description: 'First draft of NLP paper for IEEE conference submission',
    priority: 'medium', category: 'academic', completed: true,
    dueDate: d(-3), tags: ['research','NLP'], visibility: 'public',
    department: 'CSE', createdBy: student2._id,
    shareToken: crypto.randomBytes(16).toString('hex'),
  },
  // Raj's todos
  {
    title: 'Complete Web Dev Workshop Registration',
    description: 'Register for the MERN stack workshop organized by TechClub',
    priority: 'low', category: 'event', completed: true,
    dueDate: d(-1), tags: ['workshop','MERN'], visibility: 'public',
    department: 'CSE', createdBy: student3._id,
    shareToken: crypto.randomBytes(16).toString('hex'),
  },
  {
    title: 'Competitive Programming Contest Prep',
    description: 'Solve 5 problems on Codeforces — focus on graph algorithms',
    priority: 'medium', category: 'personal', completed: false,
    dueDate: d(6), tags: ['CP','coding'], visibility: 'department',
    department: 'CSE', createdBy: student3._id,
    shareToken: crypto.randomBytes(16).toString('hex'),
  },
  // Faculty/Admin todos
  {
    title: 'Upload Mid Semester Question Papers',
    description: 'Upload CS3492 DBMS and CS3482 Networks question papers',
    priority: 'high', category: 'admin', completed: false,
    dueDate: d(1), tags: ['exam','admin'], visibility: 'public',
    department: 'CSE', createdBy: faculty1._id,
    shareToken: crypto.randomBytes(16).toString('hex'),
  },
  {
    title: 'Grade Assignment 2 — All Students',
    description: 'Grade 60 student submissions for the OS shell project',
    priority: 'high', category: 'admin', completed: false,
    dueDate: d(3), tags: ['grading'], visibility: 'private',
    department: 'CSE', createdBy: faculty1._id,
    shareToken: crypto.randomBytes(16).toString('hex'),
  },
]);

console.log(`   ✅ Created ${todos.length} todos`);

// ── Create Attendance Records ─────────────────────────────────────────────────
console.log('\n📊 Creating attendance records...');

const attendanceSeeds = [
  // Nithin's attendance
  { student: student1._id, subject: 'Database Management Systems', subjectCode: 'CS3492', faculty: 'Prof. Priya Sharma',   totalClasses: 42, attendedClasses: 38, minimumRequired: 75 },
  { student: student1._id, subject: 'Computer Networks',           subjectCode: 'CS3482', faculty: 'Dr. Venkat Rao',       totalClasses: 40, attendedClasses: 28, minimumRequired: 75 },
  { student: student1._id, subject: 'Operating Systems',           subjectCode: 'CS3472', faculty: 'Dr. Admin Kumar',      totalClasses: 38, attendedClasses: 36, minimumRequired: 75 },
  { student: student1._id, subject: 'Data Structures & Algorithms',subjectCode: 'CS3462', faculty: 'Prof. Priya Sharma',   totalClasses: 45, attendedClasses: 42, minimumRequired: 75 },
  { student: student1._id, subject: 'Software Engineering',        subjectCode: 'CS3452', faculty: 'Dr. Venkat Rao',       totalClasses: 35, attendedClasses: 32, minimumRequired: 75 },
  // Priya's attendance
  { student: student2._id, subject: 'Database Management Systems', subjectCode: 'CS3492', faculty: 'Prof. Priya Sharma',   totalClasses: 42, attendedClasses: 42, minimumRequired: 75 },
  { student: student2._id, subject: 'Computer Networks',           subjectCode: 'CS3482', faculty: 'Dr. Venkat Rao',       totalClasses: 40, attendedClasses: 39, minimumRequired: 75 },
  { student: student2._id, subject: 'Machine Learning',            subjectCode: 'CS3552', faculty: 'Dr. Admin Kumar',      totalClasses: 30, attendedClasses: 29, minimumRequired: 75 },
  // Raj's attendance
  { student: student3._id, subject: 'Database Management Systems', subjectCode: 'CS3492', faculty: 'Prof. Priya Sharma',   totalClasses: 42, attendedClasses: 30, minimumRequired: 75 },
  { student: student3._id, subject: 'Computer Networks',           subjectCode: 'CS3482', faculty: 'Dr. Venkat Rao',       totalClasses: 40, attendedClasses: 38, minimumRequired: 75 },
];

for (const seed of attendanceSeeds) {
  await Attendance.create({
    ...seed,
    records: [
      { date: d(-10), status: 'present' },
      { date: d(-9),  status: 'present' },
      { date: d(-8),  status: 'absent'  },
      { date: d(-7),  status: 'present' },
      { date: d(-6),  status: 'present' },
      { date: d(-5),  status: 'absent'  },
      { date: d(-4),  status: 'present' },
      { date: d(-3),  status: 'present' },
    ],
  });
}

console.log(`   ✅ Created ${attendanceSeeds.length} attendance records`);

// ── Create Polls ──────────────────────────────────────────────────────────────
console.log('\n🗳️  Creating polls...');
const polls = await Poll.insertMany([
  {
    question: 'Which programming language should we use for the capstone project?',
    options: [
      { text: 'Python (Flask/Django)', votes: [student1._id, student2._id, student4._id] },
      { text: 'JavaScript (Node.js/React)', votes: [student3._id, faculty1._id] },
      { text: 'Java (Spring Boot)', votes: [] },
      { text: 'Go (Golang)', votes: [admin._id] },
    ],
    createdBy: faculty1._id,
    isActive: true,
    deadline: d(7),
  },
  {
    question: 'What time slot works best for extra doubt-clearing sessions?',
    options: [
      { text: 'Saturday 10AM - 12PM', votes: [student1._id, student3._id] },
      { text: 'Sunday 9AM - 11AM',    votes: [student2._id] },
      { text: 'Friday after 4PM',     votes: [student4._id, admin._id, faculty1._id] },
      { text: 'Weekday lunch break',  votes: [] },
    ],
    createdBy: faculty1._id,
    isActive: true,
    deadline: d(3),
  },
  {
    question: 'Should the department organise a study group WhatsApp community?',
    options: [
      { text: '✅ Yes, definitely!', votes: [student1._id, student2._id, student3._id, student4._id] },
      { text: '❌ No, prefer studying alone', votes: [] },
      { text: '🤔 Maybe, depends on rules', votes: [faculty1._id] },
    ],
    createdBy: admin._id,
    isActive: false,
    deadline: d(-3),
  },
  {
    question: 'Rate the new SRM Todo App!',
    options: [
      { text: '⭐⭐⭐⭐⭐ Excellent!', votes: [student1._id, student2._id, faculty1._id] },
      { text: '⭐⭐⭐⭐ Very Good',    votes: [student3._id] },
      { text: '⭐⭐⭐ Good',           votes: [] },
      { text: '⭐⭐ Needs improvement', votes: [] },
    ],
    createdBy: admin._id,
    isActive: true,
    deadline: d(14),
  },
]);
console.log(`   ✅ Created ${polls.length} polls`);

// ── Create IA Records ─────────────────────────────────────────────────────────
console.log('\n🎯 Creating IA records...');
const iaRecords = await IARecord.insertMany([
  // Nithin's IA
  { student: student1._id, subject: 'Database Management Systems', subjectCode: 'CS3492', semester: '5', ia1: 27, ia2: 25, ia3: 28, maxMarks: 30, credits: 4, grade: 'O',  gradePoint: 10 },
  { student: student1._id, subject: 'Computer Networks',           subjectCode: 'CS3482', semester: '5', ia1: 20, ia2: 22, ia3: 18, maxMarks: 30, credits: 4, grade: 'B+', gradePoint: 7  },
  { student: student1._id, subject: 'Operating Systems',           subjectCode: 'CS3472', semester: '5', ia1: 25, ia2: 26, ia3: 24, maxMarks: 30, credits: 4, grade: 'A+', gradePoint: 9  },
  { student: student1._id, subject: 'Data Structures & Algorithms',subjectCode: 'CS3462', semester: '5', ia1: 28, ia2: 29, ia3: 27, maxMarks: 30, credits: 4, grade: 'O',  gradePoint: 10 },
  { student: student1._id, subject: 'Software Engineering',        subjectCode: 'CS3452', semester: '5', ia1: 22, ia2: 24, ia3: 21, maxMarks: 30, credits: 3, grade: 'A',  gradePoint: 8  },
  // Priya's IA
  { student: student2._id, subject: 'Database Management Systems', subjectCode: 'CS3492', semester: '5', ia1: 30, ia2: 29, ia3: 30, maxMarks: 30, credits: 4, grade: 'O',  gradePoint: 10 },
  { student: student2._id, subject: 'Computer Networks',           subjectCode: 'CS3482', semester: '5', ia1: 26, ia2: 27, ia3: 25, maxMarks: 30, credits: 4, grade: 'O',  gradePoint: 10 },
  { student: student2._id, subject: 'Machine Learning',            subjectCode: 'CS3552', semester: '5', ia1: 28, ia2: 30, ia3: 27, maxMarks: 30, credits: 4, grade: 'O',  gradePoint: 10 },
]);
console.log(`   ✅ Created ${iaRecords.length} IA records`);

// ── Create Timetable ──────────────────────────────────────────────────────────
console.log('\n📋 Creating timetable...');
await Timetable.create({
  user: student1._id, semester: '5',
  slots: [
    // Monday
    { day:'Mon', time:'08:00', endTime:'09:00', subject:'DBMS',                faculty:'Prof. Priya Sharma',   room:'AB1-301', type:'lecture', color:'#6c63ff' },
    { day:'Mon', time:'09:00', endTime:'10:00', subject:'Computer Networks',    faculty:'Dr. Venkat Rao',       room:'AB1-302', type:'lecture', color:'#3b82f6' },
    { day:'Mon', time:'11:00', endTime:'13:00', subject:'DSA Lab',              faculty:'Prof. Priya Sharma',   room:'Lab-101', type:'lab',     color:'#10b981' },
    { day:'Mon', time:'14:00', endTime:'15:00', subject:'Software Engineering', faculty:'Dr. Venkat Rao',       room:'AB2-201', type:'lecture', color:'#f59e0b' },
    // Tuesday
    { day:'Tue', time:'08:00', endTime:'09:00', subject:'Operating Systems',    faculty:'Dr. Admin Kumar',      room:'AB1-303', type:'lecture', color:'#ec4899' },
    { day:'Tue', time:'09:00', endTime:'10:00', subject:'DBMS',                 faculty:'Prof. Priya Sharma',   room:'AB1-301', type:'lecture', color:'#6c63ff' },
    { day:'Tue', time:'11:00', endTime:'12:00', subject:'Mathematics',          faculty:'Dr. Venkat Rao',       room:'AB3-101', type:'tutorial',color:'#14b8a6' },
    { day:'Tue', time:'14:00', endTime:'16:00', subject:'Networks Lab',         faculty:'Dr. Venkat Rao',       room:'Lab-102', type:'lab',     color:'#3b82f6' },
    // Wednesday
    { day:'Wed', time:'08:00', endTime:'09:00', subject:'Computer Networks',    faculty:'Dr. Venkat Rao',       room:'AB1-302', type:'lecture', color:'#3b82f6' },
    { day:'Wed', time:'09:00', endTime:'10:00', subject:'Operating Systems',    faculty:'Dr. Admin Kumar',      room:'AB1-303', type:'lecture', color:'#ec4899' },
    { day:'Wed', time:'10:00', endTime:'11:00', subject:'Library / Self Study', faculty:'',                     room:'Library', type:'break',   color:'#94a3b8' },
    { day:'Wed', time:'11:00', endTime:'13:00', subject:'OS Lab',               faculty:'Dr. Admin Kumar',      room:'Lab-103', type:'lab',     color:'#ec4899' },
    // Thursday
    { day:'Thu', time:'08:00', endTime:'09:00', subject:'DSA',                  faculty:'Prof. Priya Sharma',   room:'AB1-304', type:'lecture', color:'#10b981' },
    { day:'Thu', time:'09:00', endTime:'10:00', subject:'Software Engineering', faculty:'Dr. Venkat Rao',       room:'AB2-201', type:'lecture', color:'#f59e0b' },
    { day:'Thu', time:'11:00', endTime:'12:00', subject:'DBMS Tutorial',        faculty:'Prof. Priya Sharma',   room:'AB1-301', type:'tutorial',color:'#6c63ff' },
    // Friday
    { day:'Fri', time:'08:00', endTime:'09:00', subject:'Operating Systems',    faculty:'Dr. Admin Kumar',      room:'AB1-303', type:'lecture', color:'#ec4899' },
    { day:'Fri', time:'09:00', endTime:'10:00', subject:'Computer Networks',    faculty:'Dr. Venkat Rao',       room:'AB1-302', type:'lecture', color:'#3b82f6' },
    { day:'Fri', time:'10:00', endTime:'11:00', subject:'DSA',                  faculty:'Prof. Priya Sharma',   room:'AB1-304', type:'lecture', color:'#10b981' },
    { day:'Fri', time:'14:00', endTime:'15:00', subject:'Soft Skills',          faculty:'',                     room:'AB4-101', type:'tutorial',color:'#f59e0b' },
    // Saturday
    { day:'Sat', time:'09:00', endTime:'11:00', subject:'DBMS Lab',             faculty:'Prof. Priya Sharma',   room:'Lab-101', type:'lab',     color:'#6c63ff' },
    { day:'Sat', time:'11:00', endTime:'12:00', subject:'Mathematics',          faculty:'Dr. Venkat Rao',       room:'AB3-101', type:'lecture', color:'#14b8a6' },
  ],
});
console.log(`   ✅ Created timetable with 21 class slots`);

// ── Create Faculty Feedback ───────────────────────────────────────────────────
console.log('\n⭐ Creating faculty feedback...');
await Feedback.insertMany([
  {
    student: student1._id, subject: 'Database Management Systems',
    faculty: 'Prof. Priya Sharma', semester: '5',
    rating: 5, teaching: 5, clarity: 5, helpfulness: 4,
    comment: 'Excellent teaching! Very clear explanations of complex concepts like B+ trees. Always available for doubts.',
    isAnonymous: false,
  },
  {
    student: student2._id, subject: 'Database Management Systems',
    faculty: 'Prof. Priya Sharma', semester: '5',
    rating: 5, teaching: 5, clarity: 4, helpfulness: 5,
    comment: 'Best professor in the department. Makes even normalization fun!',
    isAnonymous: false,
  },
  {
    student: student3._id, subject: 'Computer Networks',
    faculty: 'Dr. Venkat Rao', semester: '5',
    rating: 4, teaching: 4, clarity: 4, helpfulness: 3,
    comment: 'Good coverage of syllabus. Could explain routing algorithms with more examples.',
    isAnonymous: true,
  },
  {
    student: student1._id, subject: 'Operating Systems',
    faculty: 'Dr. Admin Kumar', semester: '5',
    rating: 4, teaching: 4, clarity: 5, helpfulness: 4,
    comment: 'Very knowledgeable and structured teaching. The process scheduling diagrams are really helpful.',
    isAnonymous: false,
  },
  {
    student: student4._id, subject: 'Mathematics',
    faculty: 'Dr. Venkat Rao', semester: '3',
    rating: 5, teaching: 5, clarity: 5, helpfulness: 5,
    comment: 'Outstanding professor! Makes mathematics very intuitive.',
    isAnonymous: false,
  },
  {
    student: student2._id, subject: 'Computer Networks',
    faculty: 'Dr. Venkat Rao', semester: '5',
    rating: 3, teaching: 3, clarity: 4, helpfulness: 3,
    comment: 'Content is good but sometimes the class pace is too fast.',
    isAnonymous: true,
  },
]);
console.log(`   ✅ Created 6 feedback entries`);

// ── Create Time Tracker Entries ───────────────────────────────────────────────
console.log('\n⏱️  Creating time tracker entries...');
const dbmsTodo = todos[0]; // DBMS Assignment
const networksTodo = todos[1]; // Networks Exam

// TimeEntry is unique per (todo, user) — use one entry per todo per user with sessions
await TimeEntry.insertMany([
  {
    user: student1._id, todo: dbmsTodo._id, isRunning: false,
    totalDuration: 13200, // 3h40m total
    sessions: [
      { startTime: d(-3), endTime: new Date(d(-3).getTime() + 3600000),  duration: 3600, note: 'ER diagram design' },
      { startTime: d(-2), endTime: new Date(d(-2).getTime() + 5400000),  duration: 5400, note: 'Normalization (1NF to 3NF)' },
      { startTime: d(-1), endTime: new Date(d(-1).getTime() + 4200000),  duration: 4200, note: 'SQL queries' },
    ],
  },
  {
    user: student1._id, todo: networksTodo._id, isRunning: false,
    totalDuration: 7500,
    sessions: [
      { startTime: d(-4), endTime: new Date(d(-4).getTime() + 2700000), duration: 2700, note: 'OSI model revision' },
      { startTime: d(-2), endTime: new Date(d(-2).getTime() + 4800000), duration: 4800, note: 'Subnetting practice' },
    ],
  },
  {
    user: student2._id, todo: todos[8]._id, isRunning: false,
    totalDuration: 16200,
    sessions: [
      { startTime: d(-5), endTime: new Date(d(-5).getTime() + 7200000), duration: 7200, note: 'Setting up CNN architecture' },
      { startTime: d(-3), endTime: new Date(d(-3).getTime() + 9000000), duration: 9000, note: 'Model training epoch 1-10' },
    ],
  },
]);
console.log(`   ✅ Created 7 time entries`);

// ── Create Comments ───────────────────────────────────────────────────────────
console.log('\n💬 Creating comments...');
// Department-visible todo — Networks Exam
await Comment.insertMany([
  { todo: todos[1]._id, author: student2._id, text: 'I can share my notes on routing algorithms! DM me 📚' },
  { todo: todos[1]._id, author: student3._id, text: 'I found this great Kurose Ross textbook PDF — will upload to study materials!' },
  { todo: todos[1]._id, author: faculty1._id, text: 'Focus especially on OSPF and BGP for the exam. Good luck! 👍' },
  { todo: todos[1]._id, author: student1._id, text: 'Thanks everyone! Let\'s form a study group this weekend' },
  // ML project
  { todo: todos[8]._id, author: student1._id, text: 'Amazing project Priya! Can I collaborate on this?' },
  { todo: todos[8]._id, author: faculty1._id, text: 'Great initiative! Consider using transfer learning with VGG16 to improve accuracy.' },
  // Workshop todo
  { todo: todos[10]._id, author: student1._id, text: 'I already registered! See you all there 🚀' },
  { todo: todos[10]._id, author: student2._id, text: 'The MERN workshop looks amazing. Can\'t wait!' },
]);
console.log(`   ✅ Created 8 comments`);

// ── Summary ───────────────────────────────────────────────────────────────────
console.log('\n' + '─'.repeat(55));
console.log('🎉 DATABASE SEEDED SUCCESSFULLY!\n');
console.log('📋 Seed Summary:');
console.log(`   👤 Users:       7  (1 admin, 2 faculty, 4 students)`);
console.log(`   📝 Todos:       ${todos.length}  (various visibility & priority)`);
console.log(`   📊 Attendance:  ${attendanceSeeds.length} subjects tracked`);
console.log(`   🗳️  Polls:       ${polls.length}  (3 active, 1 closed)`);
console.log(`   🎯 IA Records:  ${iaRecords.length}  (Sem 5 marks)`);
console.log(`   📋 Timetable:   21 class slots`);
console.log(`   ⭐ Feedback:    6  entries`);
console.log(`   ⏱️  Time Logs:   7  entries`);
console.log(`   💬 Comments:    8  entries`);
console.log('\n🔑 Login Credentials (all passwords: Password@123)');
console.log('─'.repeat(55));
console.log('   Role     │ Email                  │ Password');
console.log('─'.repeat(55));
console.log('   Admin    │ admin@srm.edu.in        │ Password@123');
console.log('   Faculty  │ faculty@srm.edu.in      │ Password@123');
console.log('   Faculty  │ faculty2@srm.edu.in     │ Password@123');
console.log('   Student  │ nithin@srm.edu.in       │ Password@123  ← Main test user');
console.log('   Student  │ priya@srm.edu.in        │ Password@123');
console.log('   Student  │ raj@srm.edu.in          │ Password@123');
console.log('   Student  │ ananya@srm.edu.in       │ Password@123');
console.log('─'.repeat(55));
console.log('\n🌐 Open http://localhost:3000 and login with nithin@srm.edu.in');

await mongoose.disconnect();
process.exit(0);
