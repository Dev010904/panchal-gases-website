/* Sets the .js flag before first paint so the reveal styles can arm
   themselves without a flash. This lives in its own file rather than
   inline because the Content-Security-Policy in _headers sets
   script-src 'self', which blocks inline <script>. Keep it external. */
document.documentElement.classList.add('js');
