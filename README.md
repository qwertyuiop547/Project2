# Residents Management System (RMS)

A comprehensive Django-based Residents Management System with features for complaints management, announcements, services, gallery, feedback, and community engagement.

## Features

### Home & Dashboard
- Public homepage with statistics and announcements
- Role-based dashboards (Resident, Secretary, Chairman)
- Quick stats API for AJAX updates
- Internationalization support (English/Arabic)
- Custom admin branding

### Accounts & Authentication
- User registration with profile photo and verification documents
- Approval workflow (Chairman/Secretary approval)
- Login/logout with session tracking
- Profile management and password change
- User management (activate/deactivate/delete)
- Login history and device tracking
- Residents map with coordinates
- Automatic residency validation (AJAX)

### Complaints Management
- Create complaints (anonymous or authenticated)
- File attachments support
- Status workflow (pending → in_progress → resolved → closed)
- Chairman comments and internal notes
- Complaint tracking API with timeline and ETA
- Statistics API with category breakdown
- Reports with date filters

### Feedback System
- Submit feedback with ratings (1-5)
- Optional file attachments
- Admin response capability
- Statistics and analytics
- Rating distribution charts

### Announcements
- Public announcement listing
- Create/edit announcements (Secretary/Chairman)
- Approval workflow
- Notification system for residents
- View counter
- Expiry date support

### Gallery
- Photo upload with categories
- Auto-approval system
- Like and comment functionality (AJAX)
- Featured photos
- Photo management for officials

### Suggestions
- Submit community suggestions
- Voting system (AJAX)
- Review workflow for officials
- Status tracking (pending → under review → approved/rejected → implemented)

### Services
- Service catalog with categories
- Service request system with reference numbers
- Request tracking
- Status management by staff

### Notifications
- User inbox with read/unread status
- Notification preferences
- Mark all read functionality
- Real-time unread count API
- Delete notifications

### Analytics
- Overview dashboard with system metrics
- Complaint analytics (time series, category performance)
- Feedback analytics (rating distribution, trends)
- Export functionality (JSON)

## Installation

1. **Clone the repository**
```bash
cd "Project 2"
```

2. **Create virtual environment**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Environment variables**
Create a `.env` file in the project root:
```env
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
WEATHER_API_KEY=your-weather-api-key  # Optional, for weather feature
```

5. **Run migrations**
```bash
python manage.py makemigrations
python manage.py migrate
```

6. **Create superuser**
```bash
python manage.py createsuperuser
```

**Default Admin Credentials:**
- **Username:** `superadmin`
- **Password:** `Admin@2024`
- **Email:** superadmin@barangay.com
- **Role:** Chairman (Full Access)

7. **Create initial data** (Optional)
```bash
python manage.py shell
```

Then create some categories:
```python
from complaints.models import ComplaintCategory
ComplaintCategory.objects.create(name='Maintenance', icon='fa-wrench')
ComplaintCategory.objects.create(name='Security', icon='fa-shield')
ComplaintCategory.objects.create(name='Cleanliness', icon='fa-broom')

from gallery.models import PhotoCategory
PhotoCategory.objects.create(name='General', description='General photos')
PhotoCategory.objects.create(name='Events', description='Community events')

from services.models import ServiceCategory
ServiceCategory.objects.create(name='Documents', icon='fa-file')
ServiceCategory.objects.create(name='Facilities', icon='fa-building')
```

8. **Compile messages** (for i18n)
```bash
python manage.py compilemessages
```

9. **Collect static files**
```bash
python manage.py collectstatic
```

10. **Run development server**
```bash
python manage.py runserver
```

Visit `http://localhost:8000` to access the system.

## User Roles

- **Resident**: Can file complaints, submit feedback, view announcements, use services, upload photos, submit suggestions
- **Secretary**: Can manage announcements, view all complaints and feedback
- **Chairman**: Full access - approve users, manage all content, access analytics

## Project Structure

```
core/               # Main project settings
accounts/          # User management and authentication
complaints/        # Complaints management system
feedback/          # Feedback system
announcements/     # Announcements and notifications
gallery/           # Photo gallery with likes/comments
suggestions/       # Community suggestions with voting
services/          # Service catalog and requests
notifications/     # Notification system
analytics/         # Analytics and reporting
dashboard/         # Role-based dashboards
home/              # Public homepage
templates/         # HTML templates
static/            # Static files (CSS, JS, images)
media/             # User-uploaded files
locale/            # Translation files
```

## API Endpoints

- `/api/quick-stats/` - Quick statistics (AJAX)
- `/complaints/api/statistics/` - Complaint statistics
- `/complaints/api/tracking/<id>/` - Complaint tracking with timeline
- `/feedback/api/statistics/` - Feedback statistics
- `/notifications/api/unread-count/` - Unread notifications count
- `/notifications/api/recent/` - Recent notifications
- `/analytics/export/?type=<type>` - Export analytics (overview/complaints/feedback)
- `/gallery/api/like/` - Like/unlike photo
- `/suggestions/api/vote/` - Vote/unvote suggestion
- `/accounts/api/validate-residency/` - Run residency validation

## Technologies Used

- **Backend**: Django 4.2+
- **Frontend**: Bootstrap 5, jQuery, Font Awesome
- **Database**: SQLite (development), PostgreSQL recommended for production
- **APIs**: Django REST Framework
- **i18n**: Django internationalization framework
- **Forms**: Crispy Forms with Bootstrap 5

## Security Features

- CSRF protection
- Password validation
- Session management
- Login history tracking
- Suspicious session detection
- Role-based access control
- File upload validation

## Contributing

This is a project template. Feel free to customize and extend based on your needs.

## License

This project is provided as-is for educational and development purposes.

## Support

For issues or questions, please refer to Django documentation at https://docs.djangoproject.com/

