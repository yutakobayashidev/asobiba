import { CountryTypes } from "@/types";

export default function Country({ country }: { country: CountryTypes }) {
  return (
    <div>
      <div
        className={`p-6 rounded-lg shadow-md md:flex items-center space-x-6`}
      >
        <img
          src={country.flags.png}
          alt={country.flags.alt}
          className="w-24 h-12 border-2 border-gray-300"
        />
        <div className="flex-1 border-l-2 pl-6">
          <h1 className="text-2xl font-bold mb-2">{country.name.official}</h1>
          <p>
            <strong>Common Name:</strong> {country.name.common}
          </p>
          <p>
            <strong>Region:</strong> {country.region}
          </p>
          <p>
            <strong>Subregion:</strong> {country.subregion}
          </p>
          <p>
            <strong>Population:</strong> {country.population}
          </p>
        </div>
        <div className="border-l-2 pl-6">
          <p>
            <strong>Official Languages:</strong>{" "}
            {Object.values(country.languages).join(", ")}
          </p>
          <p>
            <strong>Currency:</strong>{" "}
            {Object.values(country.currencies)[0].name} (
            {Object.values(country.currencies)[0].symbol})
          </p>
          <p>
            <strong>Timezones:</strong> {country.timezones.join(", ")}
          </p>
          <a
            href={country.maps.googleMaps}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 underline mt-2 block"
          >
            View on Google Maps
          </a>
        </div>
      </div>
      <span className="mt-3 block text-xs">
        提供:
        <a href="https://restcountries.com/" className="ml-0.5 text-blue-400">
          {" "}
          REST Countries
        </a>
      </span>
    </div>
  );
}
