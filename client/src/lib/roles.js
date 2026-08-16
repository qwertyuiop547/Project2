const OFFICIAL_ROLES = ['SECRETARY', 'CHAIRMAN'];

export function isOfficial(role) {
    return OFFICIAL_ROLES.includes(role);
}

export function isAdmin(role) {
    return role === 'CHAIRMAN';
}

export function isResident(role) {
    return role === 'RESIDENT';
}

export function getRoleLabel(role) {
    switch (role) {
        case 'CHAIRMAN':
            return 'Admin / Chairman';
        case 'SECRETARY':
            return 'Secretary';
        case 'RESIDENT':
            return 'Resident';
        default:
            return role ?? '';
    }
}
