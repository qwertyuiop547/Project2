"""
Services app views
"""
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.utils.translation import gettext as _
from django.utils import timezone
from django.db.models import Q
from django.core.paginator import Paginator
from .models import Service, ServiceCategory, ServiceRequest
from .forms import ServiceRequestForm


def service_list(request):
    """Service catalog with categories, search, active services"""
    services = Service.objects.filter(is_active=True).select_related('category')
    
    # Filters
    category = request.GET.get('category')
    if category:
        services = services.filter(category_id=category)
    
    search = request.GET.get('search')
    if search:
        services = services.filter(
            Q(name__icontains=search) | Q(description__icontains=search)
        )
    
    # Categories
    categories = ServiceCategory.objects.all()
    
    # Pagination
    paginator = Paginator(services, 12)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    context = {
        'page_obj': page_obj,
        'categories': categories,
        'category': category,
        'search': search,
    }
    
    return render(request, 'services/service_list.html', context)


def service_detail(request, pk):
    """Service detail page"""
    service = get_object_or_404(Service, pk=pk)
    
    return render(request, 'services/service_detail.html', {'service': service})


@login_required
def service_request_create(request, service_id):
    """Create service request with reference number"""
    service = get_object_or_404(Service, pk=service_id)
    
    if request.method == 'POST':
        form = ServiceRequestForm(request.POST)
        if form.is_valid():
            service_request = form.save(commit=False)
            service_request.service = service
            service_request.user = request.user
            service_request.save()
            
            messages.success(request, _('Service request submitted! Reference: {}').format(service_request.reference_number))
            return redirect('services:service_request_detail', pk=service_request.pk)
    else:
        form = ServiceRequestForm()
    
    return render(request, 'services/service_request_create.html', {
        'form': form,
        'service': service,
    })


@login_required
def service_request_list(request):
    """Service request list (owner or staff)"""
    if request.user.is_official():
        requests = ServiceRequest.objects.all()
    else:
        requests = ServiceRequest.objects.filter(user=request.user)
    
    requests = requests.select_related('service', 'user')
    
    # Filters
    status = request.GET.get('status')
    if status:
        requests = requests.filter(status=status)
    
    # Pagination
    paginator = Paginator(requests, 20)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    context = {
        'page_obj': page_obj,
        'status': status,
    }
    
    return render(request, 'services/service_request_list.html', context)


@login_required
def service_request_detail(request, pk):
    """Service request detail (owner or staff)"""
    service_request = get_object_or_404(ServiceRequest, pk=pk)
    
    # Access control
    if not request.user.is_official() and service_request.user != request.user:
        messages.error(request, _('Access denied.'))
        return redirect('services:service_request_list')
    
    # Update status (officials only)
    if request.method == 'POST' and request.user.is_official():
        new_status = request.POST.get('status')
        staff_notes = request.POST.get('staff_notes', '')
        
        service_request.status = new_status
        service_request.staff_notes = staff_notes
        service_request.handled_by = request.user
        
        if new_status == 'completed':
            service_request.completed_at = timezone.now()
        
        service_request.save()
        
        messages.success(request, _('Service request updated.'))
        return redirect('services:service_request_detail', pk=pk)
    
    return render(request, 'services/service_request_detail.html', {'service_request': service_request})

