# Azure DevOps Pipeline Stages Extension

An Azure DevOps extension that enhances the pipelines view to display detailed stage information for YAML pipelines. See which stages succeeded and identify exactly where failures occurred.

## Features

- **Stage-Level Visibility**: View the status of each stage (development, test, production, etc.) for every pipeline run
- **Visual Indicators**: Color-coded stage status indicators with clear success/failure states
- **Failure Identification**: Quickly identify which stage caused a pipeline failure
- **Timeline Integration**: Uses Azure DevOps Timeline API to fetch accurate stage information
- **Dark Theme Support**: Automatically adapts to Azure DevOps theme settings

## Prerequisites

- Node.js 16+ and npm
- Azure DevOps organization with YAML pipelines
- Permissions to install extensions in your Azure DevOps organization

## Installation

### Development Setup

1. Clone this repository:
   ```bash
   git clone <repository-url>
   cd cursor
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the extension:
   ```bash
   npm run build
   ```

4. Package the extension:
   ```bash
   npm run package
   ```
   
   This creates a `.vsix` file in the root directory.

### Installing the Extension

1. Go to your Azure DevOps organization: `https://dev.azure.com/{your-organization}`
2. Click on the **Organization Settings** (gear icon)
3. Navigate to **Extensions** → **Browse Marketplace**
4. Click **Upload** and select the generated `.vsix` file
5. Follow the installation prompts

Alternatively, you can use the Azure DevOps CLI:
```bash
az extension add --source pipeline-stages-extension-1.0.0.vsix
```

## Usage

1. After installation, navigate to **Pipelines** in your Azure DevOps project
2. You'll see a new **Pipeline Stages** hub in the pipelines section
3. Click on it to view all pipelines with their stage information
4. Expand any pipeline to see its runs
5. Each run displays:
   - Overall pipeline status
   - Individual stage status indicators
   - Failed stage highlighted (if any)
   - Duration and timing information

## Development

### Project Structure

```
cursor/
├── src/
│   ├── Components/          # React components
│   │   ├── PipelineList.tsx
│   │   ├── PipelineRow.tsx
│   │   └── StageIndicator.tsx
│   ├── Services/             # API services
│   │   └── PipelineService.ts
│   ├── Types/               # TypeScript definitions
│   │   └── PipelineTypes.ts
│   └── PipelineStagesHub/   # Main hub
│       ├── PipelineStagesHub.tsx
│       ├── PipelineStagesHub.html
│       └── PipelineStagesHub.scss
├── dist/                    # Built files (generated)
├── vss-extension.json       # Extension manifest
├── package.json
├── tsconfig.json
└── webpack.config.js
```

### Build Commands

- `npm run build` - Build the extension for production
- `npm run watch` - Build and watch for changes during development
- `npm run package` - Create the `.vsix` package file

### Testing Locally

To test the extension locally:

1. Build the extension: `npm run build`
2. Package it: `npm run package`
3. Install the `.vsix` file in your Azure DevOps organization
4. Navigate to Pipelines → Pipeline Stages

### API Endpoints Used

The extension uses the following Azure DevOps REST APIs:

- **List Pipelines**: `GET /_apis/pipelines?api-version=7.1`
- **List Pipeline Runs**: `GET /_apis/pipelines/{pipelineId}/runs?api-version=7.1`
- **Get Build Timeline**: `GET /_apis/build/builds/{buildId}/timeline?api-version=6.0`

## Configuration

### Extension Manifest

The `vss-extension.json` file contains the extension configuration:

- **Scopes**: `vso.build`, `vso.project` - Required permissions
- **Contribution**: Hub contribution targeting `ms.vss-build-web.pipelines-hub-group`

### Customization

You can customize the extension by:

- Modifying styles in the `.scss` files
- Adjusting the number of runs loaded per pipeline in `PipelineStagesHub.tsx`
- Changing the API version in `PipelineService.ts`

## Troubleshooting

### Extension Not Appearing

- Ensure the extension is installed and enabled in your organization
- Check that you have the required permissions (`vso.build`, `vso.project`)
- Verify the extension is built correctly (`npm run build`)

### No Stage Information Displayed

- Ensure your pipelines are YAML pipelines (not classic)
- Check that pipelines have multiple stages defined
- Verify the Timeline API is accessible (check browser console for errors)

### Build Errors

- Ensure all dependencies are installed: `npm install`
- Check Node.js version (16+ required)
- Verify TypeScript compilation: `npx tsc --noEmit`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Open an issue in the repository
- Check Azure DevOps Extension documentation: https://docs.microsoft.com/azure/devops/extend/
