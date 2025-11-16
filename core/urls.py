"""
URL configuration for core project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.conf.urls.i18n import i18n_patterns

# Non-localized URLs
urlpatterns = [
    path('i18n/', include('django.conf.urls.i18n')),
]

# Localized URLs
urlpatterns += i18n_patterns(
    path('admin/', admin.site.urls),
    path('', include('home.urls')),
    path('accounts/', include('accounts.urls')),
    path('dashboard/', include('dashboard.urls')),
    path('complaints/', include('complaints.urls')),
    path('feedback/', include('feedback.urls')),
    path('announcements/', include('announcements.urls')),
    path('gallery/', include('gallery.urls')),
    path('suggestions/', include('suggestions.urls')),
    path('services/', include('services.urls')),
    path('notifications/', include('notifications.urls')),
    path('messages/', include('direct_messages.urls')),
    path('ai-captain/', include('ai_captain.urls')),
    path('analytics/', include('analytics.urls')),
    prefix_default_language=True,
)

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# Custom admin site
admin.site.site_header = settings.ADMIN_SITE_HEADER
admin.site.site_title = settings.ADMIN_SITE_TITLE
admin.site.index_title = settings.ADMIN_INDEX_TITLE

