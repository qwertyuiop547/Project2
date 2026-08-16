const OFFICIAL_ROLES = ['SECRETARY', 'CHAIRMAN'];

function isOfficial(role) {
    return OFFICIAL_ROLES.includes(role);
}

function isAdmin(role) {
    return role === 'CHAIRMAN';
}

module.exports = { OFFICIAL_ROLES, isOfficial, isAdmin };
