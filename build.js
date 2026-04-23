const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// 1. تحديد المسارات
const jsonPath = path.join(__dirname, 'projects_seeding.json');
const dbPath = path.join(__dirname, 'unitrack.db'); // هيكريت ملف جديد هنا

// 2. قراءة البيانات
if (!fs.existsSync(jsonPath)) {
    console.error("❌ ملف JSON مش موجود! تأكد إنك سميته صح وحطيته في نفس الفولدر.");
    process.exit();
}
const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

// 3. إنشاء القاعدة والجداول
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    console.log("🛠 جاري بناء قاعدة بيانات UniTrack AI الجديدة...");

    // إنشاء الجداول الأساسية اللي المنصة بتحتاجها
    db.run("CREATE TABLE IF NOT EXISTS projects (id INTEGER PRIMARY KEY, title TEXT)");
    db.run("CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, name TEXT, email TEXT, password TEXT, role TEXT, project_id INTEGER)");

    const stmtProj = db.prepare("INSERT INTO projects VALUES (?, ?)");
    const stmtUser = db.prepare("INSERT INTO users VALUES (?, ?, ?, ?, ?, ?)");

    data.forEach((project) => {
        // إضافة المشروع
        stmtProj.run(project.project_id, project.title);

        // إضافة الدكتور
        const docId = `doc_${project.project_id}`;
        stmtUser.run(docId, project.doctor.name, project.doctor.email, "password", "professor", project.project_id);

        // إضافة الطلاب
        project.students.forEach(student => {
            stmtUser.run(student.code, student.name, student.email, "password", "student", project.project_id);
        });
    });

    stmtProj.finalize();
    stmtUser.finalize();

    // ضغط الملف للسرعة القصوى
    db.run("VACUUM");
    console.log("✅ مبروك! تم إنشاء unitrack.db جديد بـ 116 مشروع وكل الحسابات جاهزة.");
});

db.close();
