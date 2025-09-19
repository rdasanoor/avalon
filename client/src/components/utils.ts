export function requestInfo(name: string) {
    const info = window.prompt(`Enter ${name}`);

    if (!info) return null;

    if (!info.trim()) {
        alert(`You must enter ${name}!`);
        return null;
    }

    return info;
}
