// Check authentication
if (!authHelpers.isAuthenticated()) {
  window.location.href = '/';
}

const user = authHelpers.getUser();

// Update nav based on role
if (user.role === 'LIBRARIAN') {
  document.getElementById('navLinks').innerHTML = `
        <a href="/librarian.html">Admin Dashboard</a>
        <a href="/books.html">Browse Books</a>
        <a href="/profile.html">Profile</a>
    `;
}

// Display user info in nav
document.getElementById('userName').textContent = user.name;
document.getElementById('userRole').textContent = user.role;

// Initialize profile page
async function initProfilePage() {
  await loadProfile();
  await loadUserStats();
}

// Load profile information
async function loadProfile() {
  try {
    const profile = await window.api.user.getProfile();

    const profileInfo = document.getElementById('profileInfo');
    profileInfo.innerHTML = `
            <div class="profile-field">
                <label>Name:</label>
                <span>${profile.name}</span>
            </div>
            <div class="profile-field">
                <label>Email:</label>
                <span>${profile.email}</span>
            </div>
            <div class="profile-field">
                <label>Role:</label>
                <span class="role-badge">${profile.role}</span>
            </div>
            <div class="profile-field">
                <label>Member Since:</label>
                <span>${formatDate(profile.createdAt)}</span>
            </div>
        `;
  } catch (error) {
    console.error('Error loading profile:', error);
    document.getElementById('profileInfo').innerHTML =
      '<p class="error-message" style="display:block;">Failed to load profile.</p>';
  }
}

// Load user statistics
async function loadUserStats() {
  try {
    const loansData = await window.api.loan.getAll(1, 1000);
    const allLoans = loansData.loans;

    const activeLoans = allLoans.filter((loan) => !loan.returned_at);
    const returnedLoans = allLoans.filter((loan) => loan.returned_at);

    document.getElementById('totalLoansCount').textContent = allLoans.length;
    document.getElementById('activeLoansCount').textContent =
      activeLoans.length;
    document.getElementById('returnedLoansCount').textContent =
      returnedLoans.length;
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

// Show edit profile form
function showEditProfileForm() {
  const profile = authHelpers.getUser();

  document.getElementById('editName').value = profile.name;
  document.getElementById('editEmail').value = profile.email;
  document.getElementById('editProfileSection').classList.remove('hidden');

  // Clear messages
  document.getElementById('editProfileError').style.display = 'none';
  document.getElementById('editProfileSuccess').style.display = 'none';

  // Scroll to form
  document
    .getElementById('editProfileSection')
    .scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Hide edit profile form
function hideEditProfileForm() {
  document.getElementById('editProfileSection').classList.add('hidden');
  document.getElementById('editProfileForm').reset();
}

// Handle edit profile form submission
document
  .getElementById('editProfileForm')
  .addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('editName').value;
    const email = document.getElementById('editEmail').value;

    const errorDiv = document.getElementById('editProfileError');
    const successDiv = document.getElementById('editProfileSuccess');

    errorDiv.style.display = 'none';
    successDiv.style.display = 'none';

    try {
      const response = await window.api.user.updateProfile(name, email);

      // Update stored user info
      const updatedUser = { ...authHelpers.getUser(), name, email };
      localStorage.setItem('library_user', JSON.stringify(updatedUser));

      // Update display
      document.getElementById('userName').textContent = name;

      successDiv.textContent = 'Profile updated successfully!';
      successDiv.style.display = 'block';

      // Reload profile display
      await loadProfile();

      // Hide form after 2 seconds
      setTimeout(() => {
        hideEditProfileForm();
      }, 2000);
    } catch (error) {
      console.error('Error updating profile:', error);
      errorDiv.textContent =
        error.message || 'Failed to update profile. Please try again.';
      errorDiv.style.display = 'block';
    }
  });

// Show change password form
function showChangePasswordForm() {
  document.getElementById('changePasswordSection').classList.remove('hidden');

  // Clear messages and form
  document.getElementById('changePasswordForm').reset();
  document.getElementById('changePasswordError').style.display = 'none';
  document.getElementById('changePasswordSuccess').style.display = 'none';

  // Scroll to form
  document
    .getElementById('changePasswordSection')
    .scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Hide change password form
function hideChangePasswordForm() {
  document.getElementById('changePasswordSection').classList.add('hidden');
  document.getElementById('changePasswordForm').reset();
}

// Handle change password form submission
document
  .getElementById('changePasswordForm')
  .addEventListener('submit', async (e) => {
    e.preventDefault();

    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    const errorDiv = document.getElementById('changePasswordError');
    const successDiv = document.getElementById('changePasswordSuccess');

    errorDiv.style.display = 'none';
    successDiv.style.display = 'none';

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      errorDiv.textContent = 'New passwords do not match!';
      errorDiv.style.display = 'block';
      return;
    }

    // Validate password length
    if (newPassword.length < 6) {
      errorDiv.textContent = 'New password must be at least 6 characters long!';
      errorDiv.style.display = 'block';
      return;
    }

    try {
      await window.api.user.changePassword(currentPassword, newPassword);

      successDiv.textContent = 'Password changed successfully!';
      successDiv.style.display = 'block';

      // Hide form after 2 seconds
      setTimeout(() => {
        hideChangePasswordForm();
      }, 2000);
    } catch (error) {
      console.error('Error changing password:', error);
      errorDiv.textContent =
        error.message ||
        'Failed to change password. Please check your current password and try again.';
      errorDiv.style.display = 'block';
    }
  });

// Format date helper
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// Initialize on page load
initProfilePage();
