import os
from flask import Flask, render_template, send_from_directory, request, jsonify
from backend.routes import api_bp
from backend.config import Config
from backend.extensions import db, jwt, cors, mail
from backend.create_initial_data import create_admin_user, create_sample_data

app = Flask(__name__, 
    static_folder='frontend',
    static_url_path='',
    template_folder='frontend')

# Configure the app
app.config.from_object(Config)

# Initialize extensions
db.init_app(app)
jwt.init_app(app)
cors.init_app(app)
mail.init_app(app)

# Register API blueprint
app.register_blueprint(api_bp, url_prefix='/api')

# Create database tables
with app.app_context():
    db.create_all()
    # Create admin user if it doesn't exist
    create_admin_user()
    # Create sample data for testing
    if app.debug:
        create_sample_data()

# Serve index.html for the frontend
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    # If path starts with api/, let the API blueprint handle it
    if path.startswith('api/'):
        return jsonify({"error": "API endpoint not found"}), 404
        
    # For all other paths, serve index.html to let frontend routing handle it
    return render_template('index.html')

# Special route for downloading user files
@app.route('/backend/celery/user-downloads/<path:filename>')
def download_file(filename):
    return send_from_directory(
        os.path.join(app.root_path, 'backend', 'celery', 'user-downloads'),
        filename
    )

# Run the application
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
