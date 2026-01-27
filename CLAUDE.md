# Validator

This is a utility that can add user friendly, accessible validation to forms using native HTML attributes that is easy to use and powerful.

This project has the following goals:

1. Compactness and efficiency above all else.
2. 100% test coverage of all functionality, with a broad corpus of tests to evaluate behavior of a wide range of acceptable inputs, especially for dates.
3. Focus on high-value functionality, carefully consider whether adding new functionality is highly impactful and reusable in many projects.

When completed edits or new features:

1. Ensure that all tests run with 100% coverage
`pnpm coverage`
2. Compare the original size with the new size. Have we been able to keep the wire size as small or better than before? If the size has increased meaningfully, notify the user.
`pnpm size:wire`
