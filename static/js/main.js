// Main JavaScript for Residents Management System - Optimized for Navigation

// Optimized: Delay execution until page is fully interactive
(function() {
    'use strict';
    
    // Wait for page to be fully loaded before running heavy operations
    function initWhenReady() {
        // Wait for jQuery to be available
        if (typeof $ === 'undefined') {
            // Retry after a short delay if jQuery isn't ready
            setTimeout(initWhenReady, 50);
            return;
        }
        
        // Force hide badges initially
        try {
            $('#notification-count').hide();
            $('#message-count').hide();
        } catch (e) {
            // Silently fail if elements don't exist
        }
        
        // Optimized: Delay AJAX calls to not block navigation
        setTimeout(function() {
            // Update notification count - Only if user is authenticated and page is visible
            if ($('#notification-count').length && document.visibilityState === 'visible') {
                updateNotificationCount();
                // Optimized: Check visibility before updating, reduce frequency if page hidden
                let notificationInterval = setInterval(function() {
                    if (document.visibilityState === 'visible') {
                        updateNotificationCount();
                    }
                }, 60000); // Increased to 60 seconds for better performance
                
                // Pause when page is hidden
                document.addEventListener('visibilitychange', function() {
                    if (document.hidden) {
                        clearInterval(notificationInterval);
                    } else {
                        notificationInterval = setInterval(function() {
                            updateNotificationCount();
                        }, 60000);
                    }
                });
            }
            
            // Update message count - Only if user is authenticated and page is visible
            if ($('#message-count').length && document.visibilityState === 'visible') {
                updateMessageCount();
                // Optimized: Check visibility before updating, reduce frequency if page hidden
                let messageInterval = setInterval(function() {
                    if (document.visibilityState === 'visible') {
                        updateMessageCount();
                    }
                }, 60000); // Increased to 60 seconds for better performance
                
                // Pause when page is hidden
                document.addEventListener('visibilitychange', function() {
                    if (document.hidden) {
                        clearInterval(messageInterval);
                    } else {
                        messageInterval = setInterval(function() {
                            updateMessageCount();
                        }, 60000);
                    }
                });
            }
        }, 500); // Delay 500ms to not block navigation
    }
    
    // Use requestIdleCallback if available, otherwise setTimeout
    if (window.requestIdleCallback) {
        requestIdleCallback(initWhenReady, { timeout: 1000 });
    } else if (document.readyState === 'complete') {
        setTimeout(initWhenReady, 100);
    } else {
        window.addEventListener('load', function() {
            setTimeout(initWhenReady, 100);
        });
    }
})();

function updateNotificationCount() {
    // Optimized: Use fetch API with timeout for better performance
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    fetch(window.location.origin + '/en/notifications/api/unread-count/', {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-store'
    })
    .then(response => response.json())
    .then(data => {
        clearTimeout(timeoutId);
        var count = parseInt(data.unread_count) || 0;
        
        if (count > 0) {
            $('#notification-count').text(count).css('display', 'inline-block');
        } else {
            $('#notification-count').text('').css('display', 'none');
        }
    })
    .catch(error => {
        clearTimeout(timeoutId);
        // Silently fail - don't log to console for better performance
        $('#notification-count').text('').css('display', 'none');
    });
}

function updateMessageCount() {
    // Optimized: Use fetch API with timeout for better performance
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    fetch(window.location.origin + '/en/messages/api/unread-count/', {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-store'
    })
    .then(response => response.json())
    .then(data => {
        clearTimeout(timeoutId);
        var count = parseInt(data.unread_count) || 0;
        
        if (count > 0) {
            $('#message-count').text(count).css('display', 'inline-block');
        } else {
            $('#message-count').text('').css('display', 'none');
        }
    })
    .catch(error => {
        clearTimeout(timeoutId);
        // Silently fail - don't log to console for better performance
        $('#message-count').text('').css('display', 'none');
    });
}

// AJAX like functionality for gallery
function likePhoto(photoId) {
    $.ajax({
        url: '/gallery/api/like/',
        method: 'POST',
        data: {
            photo_id: photoId,
            csrfmiddlewaretoken: $('input[name=csrfmiddlewaretoken]').val()
        },
        success: function(data) {
            $('#like-count-' + photoId).text(data.like_count);
            if (data.liked) {
                $('#like-btn-' + photoId).addClass('btn-danger').removeClass('btn-outline-danger');
            } else {
                $('#like-btn-' + photoId).addClass('btn-outline-danger').removeClass('btn-danger');
            }
        }
    });
}

// AJAX vote functionality for suggestions
function voteSuggestion(suggestionId) {
    $.ajax({
        url: '/suggestions/api/vote/',
        method: 'POST',
        data: {
            suggestion_id: suggestionId,
            csrfmiddlewaretoken: $('input[name=csrfmiddlewaretoken]').val()
        },
        success: function(data) {
            $('#vote-count-' + suggestionId).text(data.vote_count);
            if (data.voted) {
                $('#vote-btn-' + suggestionId).addClass('btn-primary').removeClass('btn-outline-primary');
            } else {
                $('#vote-btn-' + suggestionId).addClass('btn-outline-primary').removeClass('btn-primary');
            }
        }
    });
}

