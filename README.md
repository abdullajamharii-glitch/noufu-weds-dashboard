# Wedding Invitation — Admin Dashboard

This repository contains the premium admin dashboard panel for managing and tracking guest attendance, statistics, and configuration details for the wedding invitation.

## Features
- **Overview Stat Cards**: Tracking total RSVPs, attending guests, declining guests, and total guests.
- **Days Countdown**: Displays remaining days until the wedding.
- **General Settings**: Form to customize couple names, wedding date/time, ceremony/reception venue details, and custom messages.
- **Music Settings**: Configure background music, autoplay options, and custom music URL/audio file uploads.
- **Gallery Manager**: Add and manage photos in the invitation gallery.
- **RSVP Table**: Detailed view of guest RSVPs (Name, Email, Guests count, Attending status, Custom message, Submission Date) with CSV Export and clearing options.

## Local Storage Integration
All data is stored in the user's browser `localStorage` using keys:
- `wedding_config`: Stores overall configurations (names, venues, times, themes).
- `wedding_rsvps`: Stores list of guest RSVP responses.

This data is dynamically read and shared with the main wedding invitation site when they run on the same domain.
