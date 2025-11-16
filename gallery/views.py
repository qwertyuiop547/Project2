"""
Gallery app views
"""
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import JsonResponse
from django.utils.translation import gettext as _
from django.utils import timezone
from django.db.models import Q, Count
from django.core.paginator import Paginator
from .models import Photo, PhotoCategory, PhotoLike, PhotoComment
from .forms import PhotoUploadForm, PhotoCommentForm


def gallery_list(request):
    """Public gallery with filters, counts, pagination"""
    photos = Photo.objects.filter(status='approved').select_related('uploaded_by', 'category')
    
    # Filters
    category = request.GET.get('category')
    if category:
        photos = photos.filter(category_id=category)
    
    is_featured = request.GET.get('featured')
    if is_featured == 'true':
        photos = photos.filter(is_featured=True)
    
    search = request.GET.get('search')
    if search:
        photos = photos.filter(
            Q(title__icontains=search) | Q(description__icontains=search)
        )
    
    # Counts
    total = photos.count()
    featured = photos.filter(is_featured=True).count()
    
    # Pagination
    paginator = Paginator(photos, 12)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    # Categories
    categories = PhotoCategory.objects.all()
    
    context = {
        'page_obj': page_obj,
        'categories': categories,
        'total': total,
        'featured': featured,
        'category': category,
        'search': search,
    }
    
    return render(request, 'gallery/gallery_list.html', context)


def photo_detail(request, pk):
    """Photo detail with views, comments, like state"""
    photo = get_object_or_404(Photo, pk=pk)
    
    # Increment view count
    photo.view_count += 1
    photo.save(update_fields=['view_count'])
    
    # Check if user has liked
    has_liked = False
    if request.user.is_authenticated:
        has_liked = PhotoLike.objects.filter(photo=photo, user=request.user).exists()
    
    # Comments
    comments = photo.comments.select_related('user').all()
    
    # Comment form
    if request.method == 'POST' and request.user.is_authenticated:
        comment_form = PhotoCommentForm(request.POST)
        if comment_form.is_valid():
            comment = comment_form.save(commit=False)
            comment.photo = photo
            comment.user = request.user
            comment.save()
            messages.success(request, _('Comment added.'))
            return redirect('gallery:photo_detail', pk=pk)
    else:
        comment_form = PhotoCommentForm()
    
    context = {
        'photo': photo,
        'has_liked': has_liked,
        'comments': comments,
        'comment_form': comment_form,
    }
    
    return render(request, 'gallery/photo_detail.html', context)


def category_photos(request, category_id):
    """Photos by category"""
    category = get_object_or_404(PhotoCategory, pk=category_id)
    photos = Photo.objects.filter(category=category, status='approved')
    
    # Pagination
    paginator = Paginator(photos, 12)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    context = {
        'category': category,
        'page_obj': page_obj,
    }
    
    return render(request, 'gallery/category_photos.html', context)


@login_required
def upload_photo(request):
    """Upload photo (auto-approve, default category fallback)"""
    # Ensure some default categories exist so the dropdown is not empty
    default_category_names = ['General', 'Events', 'Programs', 'Services', 'Community', 'Infrastructure', 'Others']
    for name in default_category_names:
        PhotoCategory.objects.get_or_create(name=name)

    if request.method == 'POST':
        form = PhotoUploadForm(request.POST, request.FILES)
        if form.is_valid():
            photo = form.save(commit=False)
            photo.uploaded_by = request.user
            photo.status = 'approved'  # Auto-approve
            
            # Default category if not provided
            if not photo.category:
                default_cat, created = PhotoCategory.objects.get_or_create(name='General')
                photo.category = default_cat
            
            photo.save()
            
            messages.success(request, _('Photo uploaded successfully!'))
            return redirect('gallery:photo_detail', pk=photo.pk)
    else:
        form = PhotoUploadForm()
    
    categories = PhotoCategory.objects.all()
    
    return render(request, 'gallery/upload_photo.html', {'form': form, 'categories': categories})


@login_required
def my_photos(request):
    """User's uploaded photos"""
    photos = Photo.objects.filter(uploaded_by=request.user)
    
    # Pagination
    paginator = Paginator(photos, 12)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    return render(request, 'gallery/my_photos.html', {'page_obj': page_obj})


@login_required
def like_photo(request):
    """AJAX: Toggle photo like"""
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=400)
    
    photo_id = request.POST.get('photo_id')
    photo = get_object_or_404(Photo, pk=photo_id)
    
    like, created = PhotoLike.objects.get_or_create(photo=photo, user=request.user)
    
    if not created:
        # Unlike
        like.delete()
        photo.like_count = max(0, photo.like_count - 1)
        photo.save(update_fields=['like_count'])
        return JsonResponse({'liked': False, 'like_count': photo.like_count})
    else:
        # Like
        photo.like_count += 1
        photo.save(update_fields=['like_count'])
        return JsonResponse({'liked': True, 'like_count': photo.like_count})


@login_required
def add_comment(request):
    """AJAX: Add photo comment"""
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=400)
    
    photo_id = request.POST.get('photo_id')
    comment_text = request.POST.get('comment', '').strip()
    
    if not comment_text:
        return JsonResponse({'error': 'Comment cannot be empty'}, status=400)
    
    photo = get_object_or_404(Photo, pk=photo_id)
    
    comment = PhotoComment.objects.create(
        photo=photo,
        user=request.user,
        comment=comment_text
    )
    
    return JsonResponse({
        'success': True,
        'comment': {
            'id': comment.id,
            'user': comment.user.username,
            'comment': comment.comment,
            'created_at': comment.created_at.strftime('%Y-%m-%d %H:%M'),
        }
    })


@login_required
def manage_gallery(request):
    """Manage gallery (officials)"""
    if not request.user.is_official():
        messages.error(request, _('Access denied.'))
        return redirect('gallery:gallery_list')
    
    photos = Photo.objects.all().select_related('uploaded_by', 'category')
    
    # Filters
    status = request.GET.get('status')
    if status:
        photos = photos.filter(status=status)
    
    category = request.GET.get('category')
    if category:
        photos = photos.filter(category_id=category)
    
    # Statistics
    total = photos.count()
    pending = photos.filter(status='pending').count()
    approved = photos.filter(status='approved').count()
    featured = photos.filter(is_featured=True).count()
    
    # Pagination
    paginator = Paginator(photos, 20)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    categories = PhotoCategory.objects.all()
    
    context = {
        'page_obj': page_obj,
        'categories': categories,
        'total': total,
        'pending': pending,
        'approved': approved,
        'featured': featured,
        'status': status,
        'category': category,
    }
    
    return render(request, 'gallery/manage_gallery.html', context)


@login_required
def approve_photo(request, pk):
    """Approve photo (officials)"""
    if not request.user.is_official():
        messages.error(request, _('Access denied.'))
        return redirect('gallery:gallery_list')
    
    photo = get_object_or_404(Photo, pk=pk)
    photo.status = 'approved'
    photo.approved_by = request.user
    photo.approved_at = timezone.now()
    photo.save()
    
    messages.success(request, _('Photo approved.'))
    return redirect('gallery:manage_gallery')


@login_required
def reject_photo(request, pk):
    """Reject photo (officials)"""
    if not request.user.is_official():
        messages.error(request, _('Access denied.'))
        return redirect('gallery:gallery_list')
    
    photo = get_object_or_404(Photo, pk=pk)
    photo.status = 'rejected'
    photo.save()
    
    messages.success(request, _('Photo rejected.'))
    return redirect('gallery:manage_gallery')


@login_required
def feature_photo(request, pk):
    """Feature/unfeature photo (officials)"""
    if not request.user.is_official():
        messages.error(request, _('Access denied.'))
        return redirect('gallery:gallery_list')
    
    photo = get_object_or_404(Photo, pk=pk)
    photo.is_featured = not photo.is_featured
    photo.save()
    
    if photo.is_featured:
        messages.success(request, _('Photo featured.'))
    else:
        messages.success(request, _('Photo unfeatured.'))
    
    return redirect('gallery:photo_detail', pk=pk)


@login_required
def delete_photo(request, pk):
    """Delete a photo from the gallery (officials: chairman/secretary)."""
    if not request.user.is_official():
        messages.error(request, _('Access denied.'))
        return redirect('gallery:gallery_list')

    photo = get_object_or_404(Photo, pk=pk)

    # Delete the image file from storage first (if it exists), then the DB record
    if photo.image:
        photo.image.delete(save=False)
    photo.delete()

    messages.success(request, _('Photo deleted from gallery.'))
    return redirect('gallery:manage_gallery')

