export interface Config {
    api_url: string;
}

// TODO: Can probably read this through vite?
export const DevelopmentConfig: Config = {
    // For development change to your appropriate url here
    api_url: "http://localhost:8080",
};

export const CONFIG = DevelopmentConfig;
