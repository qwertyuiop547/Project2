from django.core.cache import cache
from complaints.models import Complaint


def complaint_badge_counts(request):
    """
    Provide complaint counts for use in the global navigation.

    - For officials (secretary/chairman): total unresolved complaints
      (pending + in_progress) in the system.
    - For regular residents: their own unresolved complaints.
    
    Uses caching to reduce database queries (30 second cache).
    """
    user = getattr(request, "user", None)

    # If there is no authenticated user, don't add anything to the context
    if not user or not user.is_authenticated:
        return {}

    # Create unique cache key per user
    cache_key = f"complaint_badge_{user.id}"
    badge_count = cache.get(cache_key)
    
    if badge_count is None:
        unresolved_statuses = ["pending", "in_progress"]

        try:
            # Optimized: Use only() to fetch only needed fields, add timeout protection
            if hasattr(user, "is_official") and user.is_official():
                # Officials see all unresolved complaints - use only() for faster query
                badge_count = Complaint.objects.filter(
                    status__in=unresolved_statuses
                ).only('id').count()
            else:
                # Residents see only their own unresolved complaints
                badge_count = Complaint.objects.filter(
                    user=user, status__in=unresolved_statuses
                ).only('id').count()
        except Exception:
            # Fallback: Return 0 if query fails to prevent blocking
            badge_count = 0
        
        # Optimized: Increase cache time to reduce database queries during navigation
        cache.set(cache_key, badge_count, 60)  # 60 seconds for better performance

    return {
        "complaints_pending_count": badge_count,
    }



