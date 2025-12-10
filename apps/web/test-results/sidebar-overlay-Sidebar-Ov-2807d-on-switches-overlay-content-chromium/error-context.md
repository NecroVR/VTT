# Page snapshot

```yaml
- generic [ref=e2]:
  - banner [ref=e3]:
    - generic [ref=e4]:
      - button "VTT" [ref=e5] [cursor=pointer]
      - navigation
  - generic [ref=e7]:
    - heading "Login" [level=1] [ref=e8]
    - generic [ref=e9]:
      - generic [ref=e10]:
        - generic [ref=e11]: Email
        - textbox "Email" [ref=e12]:
          - /placeholder: Enter your email
          - text: testgm@test.com
      - generic [ref=e13]:
        - generic [ref=e14]: Password
        - textbox "Password" [ref=e15]:
          - /placeholder: Enter your password
          - text: TestPassword123!
      - generic [ref=e16]: Invalid email or password
      - button "Login" [ref=e17] [cursor=pointer]
    - generic [ref=e18]:
      - text: Don't have an account?
      - link "Register here" [ref=e19] [cursor=pointer]:
        - /url: /register
```