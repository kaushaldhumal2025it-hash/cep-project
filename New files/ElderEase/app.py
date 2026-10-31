"""
ElderEase - Flask Application Backend
Provides RESTful APIs for Appointments, Nutrition Tracking, and ElderEase Dashboard.
Serves the accessible elder-friendly single-page web interface.
"""
from flask import Flask, request, jsonify, render_template, send_from_directory, send_file, abort
from flask_cors import CORS
from datetime import datetime, date
import os
import sqlite3
import uuid
from werkzeug.utils import secure_filename

from database import get_db_connection, init_db

app = Flask(__name__, static_folder="static", template_folder="templates")
CORS(app)
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024
ALLOWED_DOCUMENT_EXTENSIONS = {"pdf", "png", "jpg", "jpeg", "doc", "docx"}
TUTORIAL_VIDEO_FILES = {
    "ElderEase_PDF_tutorial_mr_voiceover.mp4",
    "ElderEase_Video_2_Synced_Marathi_Audio.mp4",
    "ElderEase_Video_3_Synced_Marathi_Audio.mp4",
    "ElderEase_UPI_tutorial_Marathi_1.2x.mp4",
}

# Ensure database is initialized on startup
init_db()


# -------------------------------------------------------------
# Frontend Routes
# -------------------------------------------------------------
@app.route("/")
def index():
    """Renders the main elder-friendly ElderEase interface."""
    return render_template("index.html")


@app.route("/api/health")
def health_check():
    """Health check endpoint."""
    return jsonify({"status": "healthy", "app": "ElderEase"})


@app.route("/tutorial-video")
def tutorial_video():
    return tutorial_video_file("ElderEase_PDF_tutorial_mr_voiceover.mp4")


@app.route("/tutorial-videos/<path:filename>")
def tutorial_video_file(filename):
    """Serve one of the bundled UPI tutorial videos."""
    if filename not in TUTORIAL_VIDEO_FILES:
        abort(404)
    return send_from_directory(
        os.path.dirname(os.path.abspath(__file__)),
        filename,
        mimetype="video/mp4",
    )


# -------------------------------------------------------------
# Appointments CRUD API
# -------------------------------------------------------------
@app.route("/api/appointments", methods=["GET"])
def get_appointments():
    """
    Get all appointments for the senior user.
    Supports optional query filters:
      - ?month=YYYY-MM (e.g., 2026-10)
      - ?date=YYYY-MM-DD
    """
    month_filter = request.args.get("month")
    date_filter = request.args.get("date")

    conn = get_db_connection()
    cursor = conn.cursor()

    if date_filter:
        cursor.execute(
            "SELECT * FROM appointments WHERE user_id = 'senior_1' AND date = ? ORDER BY time ASC",
            (date_filter,)
        )
    elif month_filter:
        cursor.execute(
            "SELECT * FROM appointments WHERE user_id = 'senior_1' AND date LIKE ? ORDER BY date ASC, time ASC",
            (f"{month_filter}%",)
        )
    else:
        cursor.execute(
            "SELECT * FROM appointments WHERE user_id = 'senior_1' ORDER BY date ASC, time ASC"
        )

    rows = cursor.fetchall()
    conn.close()

    appointments = [dict(row) for row in rows]
    return jsonify(appointments)


@app.route("/api/appointments/<int:app_id>", methods=["GET"])
def get_appointment(app_id):
    """Retrieve a single appointment by ID."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM appointments WHERE id = ? AND user_id = 'senior_1'", (app_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        return jsonify({"error": "Appointment not found"}), 404

    return jsonify(dict(row))


@app.route("/api/appointments", methods=["POST"])
def create_appointment():
    """Create a new appointment with validation."""
    data = request.get_json() or {}

    doctor_name = (data.get("doctor_name") or "").strip()
    hospital = (data.get("hospital") or "").strip()
    app_date = (data.get("date") or "").strip()
    app_time = (data.get("time") or "").strip()
    reason = (data.get("reason") or "").strip()
    notes = (data.get("notes") or "").strip()

    # Validation
    errors = []
    if not doctor_name:
        errors.append("Doctor's name is required.")
    if not hospital:
        errors.append("Hospital or clinic name is required.")
    if not app_date:
        errors.append("Appointment date is required.")
    if not app_time:
        errors.append("Appointment time is required.")
    if not reason:
        errors.append("Reason for appointment is required.")

    if errors:
        return jsonify({"error": "Validation failed", "details": errors}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO appointments (user_id, doctor_name, hospital, date, time, reason, notes)
        VALUES ('senior_1', ?, ?, ?, ?, ?, ?)
    """, (doctor_name, hospital, app_date, app_time, reason, notes))
    new_id = cursor.lastrowid
    conn.commit()

    cursor.execute("SELECT * FROM appointments WHERE id = ?", (new_id,))
    new_app = dict(cursor.fetchone())
    conn.close()

    return jsonify({
        "success": True,
        "message": "Appointment scheduled successfully!",
        "appointment": new_app
    }), 201


@app.route("/api/appointments/<int:app_id>", methods=["PUT"])
def update_appointment(app_id):
    """Update an existing appointment."""
    data = request.get_json() or {}

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM appointments WHERE id = ? AND user_id = 'senior_1'", (app_id,))
    existing = cursor.fetchone()

    if not existing:
        conn.close()
        return jsonify({"error": "Appointment not found"}), 404

    doctor_name = (data.get("doctor_name") or existing["doctor_name"]).strip()
    hospital = (data.get("hospital") or existing["hospital"]).strip()
    app_date = (data.get("date") or existing["date"]).strip()
    app_time = (data.get("time") or existing["time"]).strip()
    reason = (data.get("reason") or existing["reason"]).strip()
    notes = data.get("notes") if "notes" in data else existing["notes"]

    if not doctor_name or not hospital or not app_date or not app_time or not reason:
        conn.close()
        return jsonify({"error": "All fields except notes are required."}), 400

    cursor.execute("""
        UPDATE appointments
        SET doctor_name = ?, hospital = ?, date = ?, time = ?, reason = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND user_id = 'senior_1'
    """, (doctor_name, hospital, app_date, app_time, reason, notes, app_id))
    conn.commit()

    cursor.execute("SELECT * FROM appointments WHERE id = ?", (app_id,))
    updated_app = dict(cursor.fetchone())
    conn.close()

    return jsonify({
        "success": True,
        "message": "Appointment updated successfully!",
        "appointment": updated_app
    })


@app.route("/api/appointments/<int:app_id>", methods=["DELETE"])
def delete_appointment(app_id):
    """Delete an appointment by ID."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM appointments WHERE id = ? AND user_id = 'senior_1'", (app_id,))
    existing = cursor.fetchone()

    if not existing:
        conn.close()
        return jsonify({"error": "Appointment not found"}), 404

    cursor.execute("DELETE FROM appointments WHERE id = ? AND user_id = 'senior_1'", (app_id,))
    conn.commit()
    conn.close()

    return jsonify({"success": True, "message": "Appointment cancelled successfully."})


# -------------------------------------------------------------
# Nutrition & Water Tracker API
# -------------------------------------------------------------
@app.route("/api/nutrition", methods=["GET"])
def get_nutrition():
    """
    Get nutrition for a given date (defaults to today: YYYY-MM-DD).
    If no entry exists for that date, creates a default entry.
    """
    req_date = request.args.get("date") or date.today().strftime("%Y-%m-%d")

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM nutrition WHERE user_id = 'senior_1' AND date = ?", (req_date,))
    row = cursor.fetchone()

    if not row:
        # Create default empty row for this day
        cursor.execute("""
            INSERT INTO nutrition (
                user_id, date, breakfast, breakfast_notes,
                lunch, lunch_notes, dinner, dinner_notes,
                snacks, snacks_notes, water_glasses, target_water
            ) VALUES ('senior_1', ?, 0, '', 0, '', 0, '', 0, '', 0, 8)
        """, (req_date,))
        conn.commit()
        cursor.execute("SELECT * FROM nutrition WHERE user_id = 'senior_1' AND date = ?", (req_date,))
        row = cursor.fetchone()

    data = dict(row)
    conn.close()
    return jsonify(data)


@app.route("/api/nutrition", methods=["PUT", "POST"])
def update_nutrition():
    """Update meal statuses and water glasses for a specific date."""
    data = request.get_json() or {}
    req_date = data.get("date") or date.today().strftime("%Y-%m-%d")

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM nutrition WHERE user_id = 'senior_1' AND date = ?", (req_date,))
    existing = cursor.fetchone()

    if not existing:
        cursor.execute("""
            INSERT INTO nutrition (
                user_id, date, breakfast, breakfast_notes,
                lunch, lunch_notes, dinner, dinner_notes,
                snacks, snacks_notes, water_glasses, target_water
            ) VALUES ('senior_1', ?, 0, '', 0, '', 0, '', 0, '', 0, 8)
        """, (req_date,))
        conn.commit()
        cursor.execute("SELECT * FROM nutrition WHERE user_id = 'senior_1' AND date = ?", (req_date,))
        existing = cursor.fetchone()

    # Extract update fields or keep existing
    breakfast = int(data.get("breakfast", existing["breakfast"]))
    breakfast_notes = data.get("breakfast_notes", existing["breakfast_notes"])
    lunch = int(data.get("lunch", existing["lunch"]))
    lunch_notes = data.get("lunch_notes", existing["lunch_notes"])
    dinner = int(data.get("dinner", existing["dinner"]))
    dinner_notes = data.get("dinner_notes", existing["dinner_notes"])
    snacks = int(data.get("snacks", existing["snacks"]))
    snacks_notes = data.get("snacks_notes", existing["snacks_notes"])
    water_glasses = max(0, min(20, int(data.get("water_glasses", existing["water_glasses"]))))
    target_water = int(data.get("target_water", existing["target_water"]))

    cursor.execute("""
        UPDATE nutrition
        SET breakfast = ?, breakfast_notes = ?,
            lunch = ?, lunch_notes = ?,
            dinner = ?, dinner_notes = ?,
            snacks = ?, snacks_notes = ?,
            water_glasses = ?, target_water = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = 'senior_1' AND date = ?
    """, (
        breakfast, breakfast_notes,
        lunch, lunch_notes,
        dinner, dinner_notes,
        snacks, snacks_notes,
        water_glasses, target_water,
        req_date
    ))
    conn.commit()

    cursor.execute("SELECT * FROM nutrition WHERE user_id = 'senior_1' AND date = ?", (req_date,))
    updated_data = dict(cursor.fetchone())
    conn.close()

    return jsonify({
        "success": True,
        "message": "Nutrition log updated!",
        "nutrition": updated_data
    })


@app.route("/api/nutrition/water", methods=["POST"])
def adjust_water():
    """
    Quick adjustment of water intake: delta can be +1 or -1.
    """
    data = request.get_json() or {}
    req_date = data.get("date") or date.today().strftime("%Y-%m-%d")
    delta = int(data.get("delta", 1))

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM nutrition WHERE user_id = 'senior_1' AND date = ?", (req_date,))
    existing = cursor.fetchone()

    if not existing:
        current_water = 0
        cursor.execute("""
            INSERT INTO nutrition (
                user_id, date, breakfast, breakfast_notes,
                lunch, lunch_notes, dinner, dinner_notes,
                snacks, snacks_notes, water_glasses, target_water
            ) VALUES ('senior_1', ?, 0, '', 0, '', 0, '', 0, '', 0, 8)
        """, (req_date,))
        conn.commit()
    else:
        current_water = existing["water_glasses"]

    new_water = max(0, min(20, current_water + delta))

    cursor.execute("""
        UPDATE nutrition
        SET water_glasses = ?, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = 'senior_1' AND date = ?
    """, (new_water, req_date))
    conn.commit()

    cursor.execute("SELECT * FROM nutrition WHERE user_id = 'senior_1' AND date = ?", (req_date,))
    updated_data = dict(cursor.fetchone())
    conn.close()

    return jsonify({
        "success": True,
        "water_glasses": new_water,
        "nutrition": updated_data
    })


# -------------------------------------------------------------
# Home Dashboard Summary API
# -------------------------------------------------------------
@app.route("/api/dashboard-summary", methods=["GET"])
def get_dashboard_summary():
    """
    Returns aggregated summary data for the home dashboard:
      - Nearest upcoming appointment
      - Today's nutrition & hydration numbers
      - Quick stats
    """
    today_str = date.today().strftime("%Y-%m-%d")

    conn = get_db_connection()
    cursor = conn.cursor()

    # Find the nearest upcoming appointment from today onwards
    cursor.execute("""
        SELECT * FROM appointments
        WHERE user_id = 'senior_1' AND date >= ?
        ORDER BY date ASC, time ASC
        LIMIT 1
    """, (today_str,))
    upcoming_row = cursor.fetchone()
    upcoming_app = dict(upcoming_row) if upcoming_row else None

    # Total appointments this month
    curr_month = date.today().strftime("%Y-%m")
    cursor.execute("""
        SELECT COUNT(*) as count FROM appointments
        WHERE user_id = 'senior_1' AND date LIKE ?
    """, (f"{curr_month}%",))
    month_app_count = cursor.fetchone()["count"]

    # Today's nutrition
    cursor.execute("SELECT * FROM nutrition WHERE user_id = 'senior_1' AND date = ?", (today_str,))
    nutr_row = cursor.fetchone()
    if not nutr_row:
        # create default row
        cursor.execute("""
            INSERT INTO nutrition (
                user_id, date, breakfast, breakfast_notes,
                lunch, lunch_notes, dinner, dinner_notes,
                snacks, snacks_notes, water_glasses, target_water
            ) VALUES ('senior_1', ?, 0, '', 0, '', 0, '', 0, '', 0, 8)
        """, (today_str,))
        conn.commit()
        cursor.execute("SELECT * FROM nutrition WHERE user_id = 'senior_1' AND date = ?", (today_str,))
        nutr_row = cursor.fetchone()

    nutr_data = dict(nutr_row)
    conn.close()

    # Calculate meal summary
    meals_eaten = (
        (1 if nutr_data.get("breakfast") else 0) +
        (1 if nutr_data.get("lunch") else 0) +
        (1 if nutr_data.get("dinner") else 0) +
        (1 if nutr_data.get("snacks") else 0)
    )

    return jsonify({
        "today_date": today_str,
        "upcoming_appointment": upcoming_app,
        "monthly_appointments_count": month_app_count,
        "nutrition": {
            "meals_eaten": meals_eaten,
            "meals_total": 4,
            "water_glasses": nutr_data.get("water_glasses", 0),
            "target_water": nutr_data.get("target_water", 8),
            "breakfast": bool(nutr_data.get("breakfast")),
            "lunch": bool(nutr_data.get("lunch")),
            "dinner": bool(nutr_data.get("dinner")),
            "snacks": bool(nutr_data.get("snacks")),
        }
    })


# -------------------------------------------------------------
# Care tools: contacts, medicine, BP, and document vault
# -------------------------------------------------------------
@app.route("/api/emergency-contacts", methods=["GET", "POST"])
def emergency_contacts():
    conn = get_db_connection()
    cursor = conn.cursor()
    if request.method == "POST":
        data = request.get_json() or {}
        name, phone = (data.get("name") or "").strip(), (data.get("phone") or "").strip()
        relationship = (data.get("relationship") or "").strip()
        if not name or not phone:
            conn.close()
            return jsonify({"error": "Name and phone number are required."}), 400
        cursor.execute(
            "INSERT INTO emergency_contacts (name, phone, relationship) VALUES (?, ?, ?)",
            (name, phone, relationship),
        )
        conn.commit()
    cursor.execute("SELECT * FROM emergency_contacts WHERE user_id = 'senior_1' ORDER BY id DESC")
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(rows)


@app.route("/api/emergency-contacts/<int:contact_id>", methods=["DELETE"])
def delete_emergency_contact(contact_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM emergency_contacts WHERE id = ? AND user_id = 'senior_1'", (contact_id,))
    conn.commit()
    deleted = cursor.rowcount
    conn.close()
    return jsonify({"success": bool(deleted)}) if deleted else (jsonify({"error": "Contact not found"}), 404)


@app.route("/api/medicines", methods=["GET", "POST"])
def medicines():
    conn = get_db_connection()
    cursor = conn.cursor()
    if request.method == "POST":
        data = request.get_json() or {}
        name, schedule = (data.get("name") or "").strip(), (data.get("schedule_time") or "").strip()
        if not name or not schedule:
            conn.close()
            return jsonify({"error": "Medicine name and time are required."}), 400
        cursor.execute(
            "INSERT INTO medicines (name, dosage, schedule_time, notes) VALUES (?, ?, ?, ?)",
            (name, (data.get("dosage") or "").strip(), schedule, (data.get("notes") or "").strip()),
        )
        conn.commit()
    cursor.execute("""
        SELECT m.*, ml.taken_date, ml.taken_time
        FROM medicines m LEFT JOIN medicine_logs ml
        ON ml.medicine_id = m.id AND ml.taken_date = date('now')
        WHERE m.user_id = 'senior_1' AND m.active = 1 ORDER BY m.schedule_time
    """)
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(rows)


@app.route("/api/medicines/<int:medicine_id>", methods=["DELETE"])
def delete_medicine(medicine_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE medicines SET active = 0 WHERE id = ? AND user_id = 'senior_1'", (medicine_id,))
    conn.commit()
    deleted = cursor.rowcount
    conn.close()
    return jsonify({"success": bool(deleted)}) if deleted else (jsonify({"error": "Medicine not found"}), 404)


@app.route("/api/medicines/<int:medicine_id>/taken", methods=["POST"])
def mark_medicine_taken(medicine_id):
    now = datetime.now()
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM medicines WHERE id = ? AND user_id = 'senior_1' AND active = 1", (medicine_id,))
    if not cursor.fetchone():
        conn.close()
        return jsonify({"error": "Medicine not found"}), 404
    cursor.execute(
        "INSERT OR REPLACE INTO medicine_logs (medicine_id, taken_date, taken_time) VALUES (?, ?, ?)",
        (medicine_id, now.strftime("%Y-%m-%d"), now.strftime("%H:%M")),
    )
    conn.commit()
    conn.close()
    return jsonify({"success": True, "taken_time": now.strftime("%H:%M")})


@app.route("/api/blood-pressure", methods=["GET", "POST"])
def blood_pressure():
    conn = get_db_connection()
    cursor = conn.cursor()
    if request.method == "POST":
        data = request.get_json() or {}
        try:
            systolic, diastolic = int(data.get("systolic")), int(data.get("diastolic"))
            pulse = int(data["pulse"]) if data.get("pulse") else None
        except (TypeError, ValueError):
            conn.close()
            return jsonify({"error": "Enter valid blood pressure numbers."}), 400
        if not 50 <= systolic <= 250 or not 30 <= diastolic <= 150:
            conn.close()
            return jsonify({"error": "Please check the blood pressure values."}), 400
        cursor.execute(
            "INSERT INTO blood_pressure_logs (systolic, diastolic, pulse, notes) VALUES (?, ?, ?, ?)",
            (systolic, diastolic, pulse, (data.get("notes") or "").strip()),
        )
        conn.commit()
    cursor.execute("SELECT * FROM blood_pressure_logs WHERE user_id = 'senior_1' ORDER BY measured_at DESC LIMIT 10")
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(rows)


@app.route("/api/documents", methods=["GET", "POST"])
def documents():
    conn = get_db_connection()
    cursor = conn.cursor()
    if request.method == "POST":
        uploaded = request.files.get("file")
        if not uploaded or not uploaded.filename:
            conn.close()
            return jsonify({"error": "Choose a document first."}), 400
        original = secure_filename(uploaded.filename)
        extension = original.rsplit(".", 1)[-1].lower() if "." in original else ""
        if extension not in ALLOWED_DOCUMENT_EXTENSIONS:
            conn.close()
            return jsonify({"error": "Allowed files: PDF, image, DOC, or DOCX."}), 400
        stored = f"{uuid.uuid4().hex}.{extension}"
        uploaded.save(os.path.join(UPLOAD_FOLDER, stored))
        cursor.execute(
            "INSERT INTO documents (original_name, stored_name, category) VALUES (?, ?, ?)",
            (original, stored, (request.form.get("category") or "Important document").strip()),
        )
        conn.commit()
    cursor.execute("SELECT * FROM documents WHERE user_id = 'senior_1' ORDER BY created_at DESC")
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(rows)


@app.route("/api/documents/<int:document_id>", methods=["GET", "DELETE"])
def document_item(document_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM documents WHERE id = ? AND user_id = 'senior_1'", (document_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return jsonify({"error": "Document not found"}), 404
    if request.method == "DELETE":
        path = os.path.join(UPLOAD_FOLDER, row["stored_name"])
        if os.path.exists(path):
            os.remove(path)
        cursor.execute("DELETE FROM documents WHERE id = ?", (document_id,))
        conn.commit()
        conn.close()
        return jsonify({"success": True})
    conn.close()
    return send_from_directory(UPLOAD_FOLDER, row["stored_name"], as_attachment=True, download_name=row["original_name"])


if __name__ == "__main__":
    print("Starting ElderEase Server on http://0.0.0.0:5000")
    app.run(host="0.0.0.0", port=5000, debug=True)
