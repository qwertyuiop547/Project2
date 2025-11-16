// Main JavaScript for Residents Management System

$(document).ready(function() {
    // Force hide badges initially
    $('#notification-count').hide();
    $('#message-count').hide();
    
    // Update notification count
    if ($('#notification-count').length) {
        updateNotificationCount();
        setInterval(updateNotificationCount, 30000); // Update every 30 seconds
    }
    
    // Update message count
    if ($('#message-count').length) {
        updateMessageCount();
        setInterval(updateMessageCount, 30000); // Update every 30 seconds
    }
});

function updateNotificationCount() {
    $.ajax({
        url: window.location.origin + '/en/notifications/api/unread-count/',
        method: 'GET',
        success: function(data) {
            console.log('Notification count received:', data);
            var count = parseInt(data.unread_count) || 0;
            console.log('Parsed count:', count);
            
            if (count > 0) {
                $('#notification-count').text(count).css('display', 'inline-block');
            } else {
                $('#notification-count').text('').css('display', 'none');
            }
        },
        error: function(xhr, status, error) {
            console.error('Notification count error:', error);
            $('#notification-count').text('').css('display', 'none');
        }
    });
}

function updateMessageCount() {
    $.ajax({
        url: window.location.origin + '/en/messages/api/unread-count/',
        method: 'GET',
        success: function(data) {
            console.log('Message count received:', data);
            var count = parseInt(data.unread_count) || 0;
            console.log('Parsed count:', count);
            
            if (count > 0) {
                $('#message-count').text(count).css('display', 'inline-block');
            } else {
                $('#message-count').text('').css('display', 'none');
            }
        },
        error: function(xhr, status, error) {
            console.error('Message count error:', error);
            $('#message-count').text('').css('display', 'none');
        }
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

