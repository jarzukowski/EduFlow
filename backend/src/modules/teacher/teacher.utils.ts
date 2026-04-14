export const maskEmail = (email: string): string => {
    const trimmedEmail = email.trim();
    const atIndex = trimmedEmail.indexOf('@');

    if (atIndex <= 0) {
        return '***';
    }

    const localPart = trimmedEmail.slice(0, atIndex);
    const domainPart = trimmedEmail.slice(atIndex + 1);

    if (!localPart || !domainPart) {
        return '***';
    }

    const dotIndex = domainPart.indexOf('.');
    const domainName =
        dotIndex > 0 ? domainPart.slice(0, dotIndex) : domainPart;
    const domainSuffix = dotIndex > 0 ? domainPart.slice(dotIndex) : '';

    const maskedLocalPart =
        localPart.length <= 2
            ? `${localPart.charAt(0)}***`
            : `${localPart.slice(0, 2)}***`;

    const maskedDomainName =
        domainName.length <= 2
            ? `${domainName.charAt(0)}***`
            : `${domainName.slice(0, 2)}***`;

    return `${maskedLocalPart}@${maskedDomainName}${domainSuffix}`;
};