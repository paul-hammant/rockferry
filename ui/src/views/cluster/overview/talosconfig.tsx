import { Box, Button, Card } from "@radix-ui/themes";
import * as yaml from "yaml"; // Use a YAML parser library

interface Props {
    config: string;
    filename: string;
}

const highlightYaml = (yamlString: string) => {
    // Parse the YAML string to ensure proper formatting
    const parsedYaml = yaml.parse(yamlString);
    const formattedYaml = yaml.stringify(parsedYaml);

    let lineNumber = 1;

    return formattedYaml
        .split("\n")
        .map((line) => {
            const highlightedLine = line
                .replace(
                    /(^|\s)(#.*$)/gm,
                    '$1<span style="color: #757575;">$2</span>', // Comments
                )
                .replace(
                    /^(\s*[\w-]+)(:)/gm,
                    `<span style="color: #d19a66;">$1</span><span style="color: white;">$2</span>`, // Keys
                )
                .replace(
                    /(:\s*)(true|false|null)/g,
                    ': <span style="color: #56b6c2;">$2</span>', // Booleans/null
                )
                .replace(
                    /(:\s*)(\d+)/g,
                    ': <span style="color: #61afef;">$2</span>', // Numbers
                )
                .replace(
                    /(:\s*)("(.*?)"|'(.*?)')/g,
                    ': <span style="color: #98c379;">$2</span>', // Strings
                );

            // Add line number
            const lineWithNumber = `<span style="color: #5c6370; margin-right: 10px;">${lineNumber}</span>${highlightedLine}`;
            lineNumber++;
            return lineWithNumber;
        })
        .join("\n");
};

const YamlHighlighter: React.FC<{ yaml: string }> = ({ yaml }) => {
    return (
        <pre
            style={{
                color: "white",
                padding: "10px",
                borderRadius: "5px",
                overflowX: "auto",
                whiteSpace: "pre-wrap", // Enables line wrapping
                wordBreak: "break-word", // Ensures long words wrap
            }}
            dangerouslySetInnerHTML={{ __html: highlightYaml(yaml) }}
        />
    );
};

export const ConfigTab: React.FC<Props> = ({ config, filename }) => {
    return (
        <Box ml="3">
            <Button
                variant="soft"
                color="purple"
                onClick={() => {
                    const file = new File([config], filename, {
                        type: "text/plain",
                    });

                    const url = URL.createObjectURL(file);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = filename;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }}
            >
                Download
            </Button>
            <Button
                ml="3"
                variant="soft"
                color="purple"
                onClick={() => navigator.clipboard.writeText(config)}
            >
                Copy
            </Button>

            <Card mt="3">
                <YamlHighlighter yaml={config} />
            </Card>
        </Box>
    );
};
