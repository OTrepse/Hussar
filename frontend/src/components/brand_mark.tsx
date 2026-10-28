export default function BrandMark() {
    return (
        <img
            className="brandLogo"
            src={`${import.meta.env.BASE_URL}mowka-logo-transparent.png`}
            alt=""
            width={42}
            height={42}
        />
    );
}
