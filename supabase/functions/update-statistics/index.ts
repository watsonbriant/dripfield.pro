// supabase/functions/update-statistics/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role key for admin operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Starting statistics update via Edge Function...')

    // Call each function individually with error handling
    const results = {
      setorder: null,
      tour_counts: null,
      statistics: null
    }

    // Update entry_setorder
    try {
      console.log('Updating entry setorder...')
      const { error: setorderError } = await supabase.rpc('update_entry_setorder')
      if (setorderError) {
        console.error('update_entry_setorder failed:', setorderError)
        results.setorder = { success: false, error: setorderError.message }
      } else {
        console.log('update_entry_setorder completed')
        results.setorder = { success: true }
      }
    } catch (error) {
      console.error('update_entry_setorder exception:', error)
      results.setorder = { success: false, error: error.message }
    }

    // Update song tour counts
    try {
      console.log('Updating song tour counts...')
      const { error: tourError } = await supabase.rpc('update_song_tour_counts')
      if (tourError) {
        console.error('update_song_tour_counts failed:', tourError)
        results.tour_counts = { success: false, error: tourError.message }
      } else {
        console.log('update_song_tour_counts completed')
        results.tour_counts = { success: true }
      }
    } catch (error) {
      console.error('update_song_tour_counts exception:', error)
      results.tour_counts = { success: false, error: error.message }
    }

    // Update song statistics
    try {
      console.log('Updating song statistics...')
      const { error: statsError } = await supabase.rpc('update_song_statistics')
      if (statsError) {
        console.error('update_song_statistics failed:', statsError)
        results.statistics = { success: false, error: statsError.message }
      } else {
        console.log('update_song_statistics completed')
        results.statistics = { success: true }
      }
    } catch (error) {
      console.error('update_song_statistics exception:', error)
      results.statistics = { success: false, error: error.message }
    }

    console.log('Statistics update completed. Results:', results)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Statistics update completed',
        results 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Edge Function error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})